import express from 'express';
import * as productModel from '../models/product.model.js';
import * as reviewModel from '../models/review.model.js';
import * as userModel from '../models/user.model.js';
import * as watchListModel from '../models/watchlist.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as productCommentModel from '../models/productComment.model.js';
import { bidNotificationHandlers } from './helpers/bidNotificationHandlers.js';
import { commentNotificationHandlers } from './helpers/commentNotificationHandlers.js';
import * as systemSettingModel from '../models/systemSetting.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import { sendMail } from '../utils/mailer.js';
import db from '../utils/db.js';

const router = express.Router();

//EDIT: DRY - Helper function to redirect back to the previous page
const redirectBack = (req, res) => {
  const backURL = req.headers.referer || '/';
  res.redirect(backURL);
};

// ROUTE: BIDDING HISTORY PAGE (Requires Authentication)
router.get('/bidding-history', isAuthenticated, async (req, res) => {
  const productId = req.query.id;
  
  if (!productId) {
    return res.redirect('/');
  }

  try {
    // Get product information
    const product = await productModel.findByProductId2(productId, null);
    
    if (!product) {
      return res.status(404).render('404', { message: 'Product not found' });
    }

    // Load bidding history
    const biddingHistory = await biddingHistoryModel.getBiddingHistory(productId);
    
    res.render('vwProduct/biddingHistory', { 
      product,
      biddingHistory
    });
  } catch (error) {
    console.error('Error loading bidding history:', error);
    res.status(500).render('500', { message: 'Unable to load bidding history' });
  }
});

// ROUTE 1: THÊM VÀO WATCHLIST (POST)
router.post('/watchlist', isAuthenticated, async (req, res) => {
  const userId = req.session.authUser.id;
  const productId = req.body.productId;

  const isInWatchlist = await watchListModel.isInWatchlist(userId, productId);
  if (!isInWatchlist) {
    await watchListModel.addToWatchlist(userId, productId);
  }

  // SỬA LẠI: Lấy địa chỉ trang trước đó từ header
  // Nếu không tìm thấy (trường hợp hiếm), quay về trang chủ '/'
  redirectBack(req, res);
});

// ROUTE 2: XÓA KHỎI WATCHLIST (DELETE)
router.delete('/watchlist', isAuthenticated, async (req, res) => {
  const userId = req.session.authUser.id;
  const productId = req.body.productId;

  await watchListModel.removeFromWatchlist(userId, productId);

  // SỬA LẠI: Tương tự như trên
  redirectBack(req, res);
});

// ROUTE 3: ĐẶT GIÁ (POST) - Server-side rendering with automatic bidding
router.post('/bid', isAuthenticated, async (req, res) => {
  const userId = req.session.authUser.id;
  const productId = parseInt(req.body.productId);
  const bidAmount = parseFloat(req.body.bidAmount.replace(/,/g, '')); // Remove commas from input

  try {
    // Use transaction with row-level locking to prevent race conditions
    const result = await db.transaction(async (trx) => {
      // 1. Lock the product row for update to prevent concurrent modifications
      const product = await trx('products')
        .where('id', productId)
        .forUpdate() // This creates a row-level lock
        .first();
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Store previous highest bidder info for email notification
      const previousHighestBidderId = product.highest_bidder_id;
      const previousPrice = parseFloat(product.current_price || product.starting_price);

      // 2. Check if product is already sold
      if (product.is_sold === true) {
        throw new Error('This product has already been sold');
      }

      // 3. Check if seller cannot bid on their own product
      if (product.seller_id === userId) {
        throw new Error('You cannot bid on your own product');
      }

      // 4. Check if bidder has been rejected
      const isRejected = await trx('rejected_bidders')
        .where('product_id', productId)
        .where('bidder_id', userId)
        .first();
      
      if (isRejected) {
        throw new Error('You have been rejected from bidding on this product by the seller');
      }

      // 5. Check rating point
      const ratingPoint = await reviewModel.calculateRatingPoint(userId);
      const userReviews = await reviewModel.getReviewsByUserId(userId);
      const hasReviews = userReviews.length > 0;
      
      if (!hasReviews) {
        // User has no reviews yet (unrated)
        if (!product.allow_unrated_bidder) {
          throw new Error('This seller does not allow unrated bidders to bid on this product.');
        }
      } else if (ratingPoint.rating_point < 0) {
        throw new Error('You are not eligible to place bids due to your rating.');
      } else if (ratingPoint.rating_point === 0) {
        throw new Error('You are not eligible to place bids due to your rating.');
      } else if (ratingPoint.rating_point <= 0.8) {
        throw new Error('Your rating point is not greater than 80%. You cannot place bids.');
      }

      // 6. Check if auction has ended
      const now = new Date();
      const endDate = new Date(product.end_at);
      if (now > endDate) {
        throw new Error('Auction has ended');
      }

      // 7. Validate bid amount against current price
      const currentPrice = parseFloat(product.current_price || product.starting_price);
      
      // bidAmount đã được validate ở frontend là phải > currentPrice
      // Nhưng vẫn kiểm tra lại để đảm bảo
      if (bidAmount <= currentPrice) {
        throw new Error(`Bid must be higher than current price (${currentPrice.toLocaleString()} VND)`);
      }

      // 8. Check minimum bid increment
      const minIncrement = parseFloat(product.step_price);
      if (bidAmount < currentPrice + minIncrement) {
        throw new Error(`Bid must be at least ${minIncrement.toLocaleString()} VND higher than current price`);
      }

      // 9. Check and apply auto-extend if needed
      let extendedEndTime = null;
      if (product.auto_extend) {
        // Get system settings for auto-extend configuration
        const settings = await systemSettingModel.getSettings();
        const triggerMinutes = settings?.auto_extend_trigger_minutes;
        const extendMinutes = settings?.auto_extend_duration_minutes;
        
        // Calculate time remaining until auction ends
        const endTime = new Date(product.end_at);
        const minutesRemaining = (endTime - now) / (1000 * 60);
        
        // If within trigger window, extend the auction
        if (minutesRemaining <= triggerMinutes) {
          extendedEndTime = new Date(endTime.getTime() + extendMinutes * 60 * 1000);
          
          // Update end_at in the product object for subsequent checks
          product.end_at = extendedEndTime;
        }
      }

      // ========== AUTOMATIC BIDDING LOGIC ==========
      
      let newCurrentPrice;
      let newHighestBidderId;
      let newHighestMaxPrice;
      let shouldCreateHistory = true; // Flag to determine if we should create bidding history

      // Special handling for buy_now_price: First-come-first-served
      // If current highest bidder already has max >= buy_now, and a NEW bidder comes in, 
      // the existing bidder wins at buy_now price immediately
      const buyNowPrice = product.buy_now_price ? parseFloat(product.buy_now_price) : null;
      let buyNowTriggered = false;
      
      if (buyNowPrice && product.highest_bidder_id && product.highest_max_price && product.highest_bidder_id !== userId) {
        const currentHighestMaxPrice = parseFloat(product.highest_max_price);
        
        // If current highest bidder already bid >= buy_now, they win immediately (when new bidder comes)
        if (currentHighestMaxPrice >= buyNowPrice) {
          newCurrentPrice = buyNowPrice;
          newHighestBidderId = product.highest_bidder_id;
          newHighestMaxPrice = currentHighestMaxPrice;
          buyNowTriggered = true;
          // New bidder's auto-bid will be recorded, but they don't win
        }
      }

      // Only run normal auto-bidding if buy_now not triggered by existing bidder
      if (!buyNowTriggered) {
        // Case 0: Người đặt giá chính là người đang giữ giá cao nhất
        if (product.highest_bidder_id === userId) {
          // Chỉ update max_price trong auto_bidding, không thay đổi current_price
          // Không tạo bidding_history mới vì giá không thay đổi
          newCurrentPrice = parseFloat(product.current_price || product.starting_price);
          newHighestBidderId = userId;
          newHighestMaxPrice = bidAmount; // Update max price
          shouldCreateHistory = false; // Không tạo history mới
        }
        // Case 1: Chưa có người đấu giá nào (first bid)
        else if (!product.highest_bidder_id || !product.highest_max_price) {
          newCurrentPrice = product.starting_price; // Only 1 bidder, no competition, set to starting price
          newHighestBidderId = userId;
          newHighestMaxPrice = bidAmount;
        } 
        // Case 2: Đã có người đấu giá trước đó
        else {
          const currentHighestMaxPrice = parseFloat(product.highest_max_price);
          const currentHighestBidderId = product.highest_bidder_id;

          // Case 2a: bidAmount < giá tối đa của người cũ
          if (bidAmount < currentHighestMaxPrice) {
            // Người cũ thắng, giá hiện tại = bidAmount của người mới
            newCurrentPrice = bidAmount;
            newHighestBidderId = currentHighestBidderId;
            newHighestMaxPrice = currentHighestMaxPrice; // Giữ nguyên max price của người cũ
          }
          // Case 2b: bidAmount == giá tối đa của người cũ
          else if (bidAmount === currentHighestMaxPrice) {
            // Người cũ thắng theo nguyên tắc first-come-first-served
            newCurrentPrice = bidAmount;
            newHighestBidderId = currentHighestBidderId;
            newHighestMaxPrice = currentHighestMaxPrice;
          }
          // Case 2c: bidAmount > giá tối đa của người cũ
          else {
            // Người mới thắng, giá hiện tại = giá max của người cũ + step_price
            newCurrentPrice = currentHighestMaxPrice + minIncrement;
            newHighestBidderId = userId;
            newHighestMaxPrice = bidAmount;
          }
        }

        // 7. Check if buy now price is reached after auto-bidding
        if (buyNowPrice && newCurrentPrice >= buyNowPrice) {
          // Nếu đạt giá mua ngay, set giá = buy_now_price
          newCurrentPrice = buyNowPrice;
          buyNowTriggered = true;
        }
      }

      let productSold = buyNowTriggered;

      // 8. Update product with new price, highest bidder, and highest max price
      const updateData = {
        current_price: newCurrentPrice,
        highest_bidder_id: newHighestBidderId,
        highest_max_price: newHighestMaxPrice
      };

      // If buy now price is reached, close auction immediately - takes priority over auto-extend
      if (productSold) {
        updateData.end_at = new Date(); // Kết thúc auction ngay lập tức
        updateData.closed_at = new Date();
        // is_sold remains NULL → Product goes to PENDING status (waiting for payment)
      }
      // If auto-extend was triggered and product NOT sold, update end_at
      else if (extendedEndTime) {
        updateData.end_at = extendedEndTime;
      }

      await trx('products')
        .where('id', productId)
        .update(updateData);

      // 9. Add bidding history record only if price changed
      // Record ghi lại người đang nắm giá sau khi tính toán automatic bidding
      if (shouldCreateHistory) {
        await trx('bidding_history').insert({
          product_id: productId,
          bidder_id: newHighestBidderId,
          current_price: newCurrentPrice
        });
      }

      // 10. Update auto_bidding table for the bidder
      // Sử dụng raw query để upsert (insert or update)
      await trx.raw(`
        INSERT INTO auto_bidding (product_id, bidder_id, max_price)
        VALUES (?, ?, ?)
        ON CONFLICT (product_id, bidder_id)
        DO UPDATE SET 
          max_price = EXCLUDED.max_price,
          created_at = NOW()
      `, [productId, userId, bidAmount]);



      return { 
        newCurrentPrice, 
        newHighestBidderId, 
        userId, 
        bidAmount,
        productSold,
        autoExtended: !!extendedEndTime,
        newEndTime: extendedEndTime,
        productName: product.name,
        sellerId: product.seller_id,
        previousHighestBidderId,
        previousPrice,
        priceChanged: previousPrice !== newCurrentPrice
      };
    });

    const [seller, currentBidder, previousBidder] = await Promise.all([
      userModel.findById(result.sellerId),
      userModel.findById(result.userId),
      result.previousHighestBidderId && result.previousHighestBidderId !== result.userId
        ? userModel.findById(result.previousHighestBidderId)
        : null
    ]);

    //append seller, currentBidder, previousBidder to result for notification handlers
    const enrichedResult = Object.assign({}, result, { seller, currentBidder, previousBidder });
    console.log('Enriched Result for Notifications:', enrichedResult);

    // ========== SEND EMAIL NOTIFICATIONS (outside transaction) ==========
    // IMPORTANT: Run email sending asynchronously to avoid blocking the response
    // This significantly improves perceived performance for the user
    // EDITED: NEW notifier style through helpers
    const productUrl = `${req.protocol}://${req.get('host')}/products/detail?id=${productId}`;

    const activeHandlers = bidNotificationHandlers.filter(handler => handler.shouldHandle(enrichedResult));
    await Promise.all(activeHandlers.map(handler => handler.send(enrichedResult, sendMail, productUrl, enrichedResult.productName)));

    // Success message
    let baseMessage = '';
    if (result.productSold) {
      // Sản phẩm đã đạt giá buy now và chuyển sang PENDING (chờ thanh toán)
      if (result.newHighestBidderId === result.userId) {
        // Người đặt giá này thắng và trigger buy now
        baseMessage = `Congratulations! You won the product with Buy Now price: ${result.newCurrentPrice.toLocaleString()} VND. Please proceed to payment.`;
      } else {
        // Người đặt giá này KHÔNG thắng nhưng đã trigger buy now cho người khác
        baseMessage = `Product has been sold to another bidder at Buy Now price: ${result.newCurrentPrice.toLocaleString()} VND. Your bid helped reach the Buy Now threshold.`;
      }
    } else if (result.newHighestBidderId === result.userId) {
      baseMessage = `Bid placed successfully! Current price: ${result.newCurrentPrice.toLocaleString()} VND (Your max: ${result.bidAmount.toLocaleString()} VND)`;
    } else {
      baseMessage = `Bid placed! Another bidder is currently winning at ${result.newCurrentPrice.toLocaleString()} VND`;
    }
    
    // Add auto-extend notification if applicable
    if (result.autoExtended) {
      const extendedTimeStr = new Date(result.newEndTime).toLocaleString('vi-VN');
      baseMessage += ` | Auction extended to ${extendedTimeStr}`;
    }
    
    req.session.success_message = baseMessage;
    res.redirect(`/products/detail?id=${productId}`);

  } catch (error) {
    console.error('Bid error:', error);
    req.session.error_message = error.message || 'An error occurred while placing bid. Please try again.';
    res.redirect(`/products/detail?id=${productId}`);
  }
});

// ROUTE: POST COMMENT
router.post('/comment', isAuthenticated, async (req, res) => {
  const { productId, content, parentId } = req.body;
  const userId = req.session.authUser.id;

  try {
    if (!content || content.trim().length === 0) {
      req.session.error_message = 'Comment cannot be empty';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Create comment
    await productCommentModel.createComment(productId, userId, content.trim(), parentId || null);

    // Get product and users for email notification
    const product = await productModel.findByProductId2(productId, null);
    const commenter = await userModel.findById(userId);
    const seller = await userModel.findById(product.seller_id);
    const productUrl = `${req.protocol}://${req.get('host')}/products/detail?id=${productId}`;

    // Check if the commenter is the seller (seller is replying)
    const isSellerReplying = userId === product.seller_id;

    let notifyUsers = [];

    if (isSellerReplying && parentId) {
      // Seller is replying to a comment → notify the original commenter
      const [bidders, commenters] = await Promise.all([
        biddingHistoryModel.getUniqueBidders(productId),
        productCommentModel.getUniqueCommenters(productId)
      ]);

      notifyUsers = [...bidders, ...commenters]
        .filter(user => user.id !== userId) // Exclude the seller themselves
        .reduce((map, user) => {
          if (!map.has(user.id)) {
            map.set(user.id, user);
          }
          return map;
        }, new Map());
      notifyUsers = Array.from(notifyUsers.values());
    }

    const notifyData = {
      isSellerReplying,
      notifyUsers,
      product,
      content: content.trim(),
      productUrl,
      seller,
      commenter,
      isReply: !!parentId
    };

    const activeHandlers = commentNotificationHandlers.filter(handler => handler.shouldHandle(notifyData));
    await Promise.all(activeHandlers.map(handler => handler.send(notifyData, sendMail)));

    req.session.success_message = 'Comment posted successfully!';
    res.redirect(`/products/detail?id=${productId}`);

  } catch (error) {
    console.error('Post comment error:', error);
    req.session.error_message = 'Failed to post comment. Please try again.';
    res.redirect(`/products/detail?id=${productId}`);
  }
});


// ROUTE 4: GET BIDDING HISTORY
router.get('/bid-history/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const history = await biddingHistoryModel.getBiddingHistory(productId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({ success: false, message: 'Unable to load bidding history' });
  }
  const result = await productModel.findByProductId(productId);
  const relatedProducts = await productModel.findRelatedProducts(productId);
  const product = {
    thumbnail: result[0].thumbnail,
    sub_images: result.reduce((acc, curr) => {
      if (curr.img_link) {
        acc.push(curr.img_link);
      }
      return acc;
    }, []),
    id: result[0].id,
    name: result[0].name,
    starting_price: result[0].starting_price,
    current_price: result[0].current_price,
    seller_id: result[0].seller_id,
    seller_fullname: result[0].seller_name,
    seller_rating: result[0].seller_rating_plus / (result[0].seller_rating_plus + result[0].seller_rating_minus),
    seller_member_since: new Date(result[0].seller_created_at).getFullYear(),
    buy_now_price: result[0].buy_now_price,
    seller_id: result[0].seller_id,
    hightest_bidder_id: result[0].highest_bidder_id,
    bidder_name: result[0].bidder_name,
    category_name: result[0].category_name,
    bid_count: result[0].bid_count,
    created_at: result[0].created_at,
    end_at: result[0].end_at,
    description: result[0].description,
    related_products: relatedProducts
  }
  res.render('vwProduct/details', { product });
});

export default router;