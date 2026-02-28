import express from 'express';
import * as reviewModel from '../models/review.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import db from '../utils/db.js';

const router = express.Router();

//EDIT: HELPER FUNCTION, DRY, KISS

const executeBuyNow = async (trx, productId, userId) => {
  // 1. Fetch product with seller info
  const product = await trx('products')
    .leftJoin('users as seller', 'products.seller_id', 'seller.id')
    .where('products.id', productId)
    .select('products.*', 'seller.fullname as seller_name')
    .first();

  if (!product) throw new Error('Product not found');
  if (product.seller_id === userId) throw new Error('Seller cannot buy their own product');
  if (product.is_sold !== null) throw new Error('Product is no longer available');

  const now = new Date();
  const endDate = new Date(product.end_at);
  if (endDate <= now || product.closed_at) throw new Error('Auction has already ended');
  if (!product.buy_now_price) throw new Error('Buy Now option is not available for this product');

  const buyNowPrice = parseFloat(product.buy_now_price);

  // 2. Check rejection
  const isRejected = await trx('rejected_bidders')
    .where({ product_id: productId, bidder_id: userId })
    .first();
  if (isRejected) throw new Error('You have been rejected from bidding on this product');

  // 3. Check rating requirement
  if (!product.allow_unrated_bidder) {
    const ratingData = await reviewModel.calculateRatingPoint(userId);
    if (!ratingData || ratingData.rating_point === 0) {
      throw new Error('This product does not allow bidders without ratings');
    }
  }

  // 4. Execute Buy Now
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

  await trx('bidding_history').insert({
    product_id: productId,
    bidder_id: userId,
    current_price: buyNowPrice,
    is_buy_now: true
  });

  return { productName: product.name };
};


// ROUTE: BUY NOW (POST) - Bidder directly purchases product at buy now price
router.post('/buy-now', isAuthenticated, async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.authUser.id;

  try {
    const result = await db.transaction(async trx => {
      return await executeBuyNow(trx, productId, userId)
    });

    res.json({
      success: true,
      message: 'Congratulations! You have successfully purchased the product at Buy Now price. Please proceed to payment.',
      redirectUrl: `/products/complete-order?id=${productId}`
    })

  } catch (error) {
    console.error('Buy Now error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to purchase product' 
    });
  }
});


export default router;