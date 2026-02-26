import express from 'express';
import * as reviewModel from '../models/review.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import db from '../utils/db.js';

const router = express.Router();

// ROUTE: BUY NOW (POST) - Bidder directly purchases product at buy now price
router.post('/buy-now', isAuthenticated, async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.authUser.id;

  try {
    await db.transaction(async (trx) => {
      // 1. Get product information
      const product = await trx('products')
        .leftJoin('users as seller', 'products.seller_id', 'seller.id')
        .where('products.id', productId)
        .select('products.*', 'seller.fullname as seller_name')
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      // 2. Check if user is the seller
      if (product.seller_id === userId) {
        throw new Error('Seller cannot buy their own product');
      }

      // 3. Check if product is still ACTIVE
      const now = new Date();
      const endDate = new Date(product.end_at);

      if (product.is_sold !== null) {
        throw new Error('Product is no longer available');
      }

      if (endDate <= now || product.closed_at) {
        throw new Error('Auction has already ended');
      }

      // 4. Check if buy_now_price exists
      if (!product.buy_now_price) {
        throw new Error('Buy Now option is not available for this product');
      }

      const buyNowPrice = parseFloat(product.buy_now_price);

      // 5. Check if bidder is rejected
      const isRejected = await trx('rejected_bidders')
        .where({ product_id: productId, bidder_id: userId })
        .first();

      if (isRejected) {
        throw new Error('You have been rejected from bidding on this product');
      }

      // 6. Check if bidder is unrated and product doesn't allow unrated bidders
      if (!product.allow_unrated_bidder) {
        const bidder = await trx('users').where('id', userId).first();
        const ratingData = await reviewModel.calculateRatingPoint(userId);
        const ratingPoint = ratingData ? ratingData.rating_point : 0;
        
        if (ratingPoint === 0) {
          throw new Error('This product does not allow bidders without ratings');
        }
      }

      // 7. Close the auction immediately at buy now price
      // Mark as buy_now_purchase to distinguish from regular bidding wins
      await trx('products')
        .where('id', productId)
        .update({
          current_price: buyNowPrice,
          highest_bidder_id: userId,
          highest_max_price: buyNowPrice,
          end_at: now,
          closed_at: now,
          is_buy_now_purchase: true
        });

      // 8. Create bidding history record
      // Mark this record as a Buy Now purchase (not a regular bid)
      await trx('bidding_history').insert({
        product_id: productId,
        bidder_id: userId,
        current_price: buyNowPrice,
        is_buy_now: true
      });

      // Note: We do NOT insert into auto_bidding table for Buy Now purchases
      // Reason: Buy Now is a direct purchase, not an auto bid. If we insert here,
      // it could create inconsistency where another bidder has higher max_price 
      // in auto_bidding table but this user is the highest_bidder in products table.
      // The bidding_history record above is sufficient to track this purchase.
    });

    res.json({ 
      success: true, 
      message: 'Congratulations! You have successfully purchased the product at Buy Now price. Please proceed to payment.',
      redirectUrl: `/products/complete-order?id=${productId}`
    });

  } catch (error) {
    console.error('Buy Now error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to purchase product' 
    });
  }
});


export default router;