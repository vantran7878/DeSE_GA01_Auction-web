import express from 'express';
import * as productModel from '../models/product.model.js';
import * as rejectedBidderModel from '../models/rejectedBidder.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import { sendMail } from '../utils/mailer.js';
import db from '../utils/db.js';
import { rejectNotificationHandlers } from './helpers/rejectNotificationHandlers.js';
//EDIT: HTML SRP

const router = express.Router();

//Helper function 
const executeRejectBidder = async (trx, productId, bidderId, sellerId) => {
  // Lock and verify ownership
  const product = await trx('products').where('id', productId).forUpdate().first();
  if (!product) throw new Error('Product not found');
  if (product.seller_id !== sellerId) throw new Error('Only the seller can reject bidders');

  const now = new Date();
  if (product.is_sold !== null || new Date(product.end_at) <= now || product.closed_at) {
    throw new Error('Can only reject bidders for active auctions');
  }

  // Check bidder actually bid
  const autoBid = await trx('auto_bidding')
    .where('product_id', productId)
    .where('bidder_id', bidderId)
    .first();
  if (!autoBid) throw new Error('This bidder has not placed a bid on this product');

  // Get info for email
  const rejectedBidder = await trx('users').where('id', bidderId).first();
  const seller = await trx('users').where('id', sellerId).first();

  // Perform rejection
  await trx('rejected_bidders')
    .insert({ product_id: productId, bidder_id: bidderId, seller_id: sellerId })
    .onConflict(['product_id', 'bidder_id']).ignore();

  await trx('bidding_history')
    .where('product_id', productId)
    .where('bidder_id', bidderId)
    .del();

  await trx('auto_bidding')
    .where('product_id', productId)
    .where('bidder_id', bidderId)
    .del();

  // Recalculate highest bidder & price (your original logic)
  const allAutoBids = await trx('auto_bidding')
    .where('product_id', productId)
    .orderBy('max_price', 'desc');

  // ... (keep your existing recalculation logic here - unchanged)
  const bidderIdNum = parseInt(bidderId);
  const highestBidderIdNum = parseInt(product.highest_bidder_id);
  const wasHighestBidder = (highestBidderIdNum === bidderIdNum);

  if (allAutoBids.length === 0) {
    // No more bidders - reset to starting state
    await trx('products')
      .where('id', productId)
      .update({
        highest_bidder_id: null,
        current_price: product.starting_price,
        highest_max_price: null
      });
    // Don't add bidding history - no one actually bid
  } else if (allAutoBids.length === 1) {
    // Only one bidder left - they win at starting price (no competition)
    const winner = allAutoBids[0];
    const newPrice = product.starting_price;

    await trx('products')
      .where('id', productId)
      .update({
        highest_bidder_id: winner.bidder_id,
        current_price: newPrice,
        highest_max_price: winner.max_price
      });

    // Add history entry only if price changed
    if (wasHighestBidder || product.current_price !== newPrice) {
      await trx('bidding_history').insert({
        product_id: productId,
        bidder_id: winner.bidder_id,
        current_price: newPrice
      });
    }
  } else if (wasHighestBidder) {
    // Multiple bidders and rejected was highest - recalculate price
    const firstBidder = allAutoBids[0];
    const secondBidder = allAutoBids[1];
    
    // Current price should be minimum to beat second highest
    let newPrice = secondBidder.max_price + product.step_price;
    
    // But cannot exceed first bidder's max
    if (newPrice > firstBidder.max_price) {
      newPrice = firstBidder.max_price;
    }

    await trx('products')
      .where('id', productId)
      .update({
        highest_bidder_id: firstBidder.bidder_id,
        current_price: newPrice,
        highest_max_price: firstBidder.max_price
      });

    // Add history entry only if price changed
    const lastHistory = await trx('bidding_history')
      .where('product_id', productId)
      .orderBy('created_at', 'desc')
      .first();

    if (!lastHistory || lastHistory.current_price !== newPrice) {
      await trx('bidding_history').insert({
        product_id: productId,
        bidder_id: firstBidder.bidder_id,
        current_price: newPrice
      });
    }
  }

  return {
    rejectedBidderEmail: rejectedBidder?.email,
    rejectedBidderName: rejectedBidder?.fullname,
    productName: product.name,
    sellerName: seller?.fullname,
    productUrl: null // will be set in route
  };
};


// ROUTE: REJECT BIDDER (POST) - Seller rejects a bidder from a product
router.post('/reject-bidder', isAuthenticated, async (req, res) => {
  const { productId, bidderId } = req.body;
  const sellerId = req.session.authUser.id;

  try {
    const result = await db.transaction(async trx => {
      return await executeRejectBidder(trx, productId, bidderId, sellerId);
    });

    const productUrl = `${req.protocol}://${req.get('host')}/products/${productId}`;
    result.productUrl = productUrl;

    const activeHandlers = rejectNotificationHandlers.filter(handler => handler.shouldHandle(result));
    await Promise.all(activeHandlers.map(handler => handler.send(result, sendMail)));

    res.json({ success: true, message: 'Bidder rejected successfully', productUrl });
  } catch (error) {
    console.error('Error rejecting bidder:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to reject bidder' 
    });
  }
});

// ROUTE: UNREJECT BIDDER (POST) - Seller removes a bidder from rejected list
router.post('/unreject-bidder', isAuthenticated, async (req, res) => {
  const { productId, bidderId } = req.body;
  const sellerId = req.session.authUser.id;

  try {
    // Verify product ownership
    const product = await productModel.findByProductId2(productId, sellerId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.seller_id !== sellerId) {
      throw new Error('Only the seller can unreject bidders');
    }

    // Check product status - only allow unrejection for ACTIVE products
    const now = new Date();
    const endDate = new Date(product.end_at);
    
    if (product.is_sold !== null || endDate <= now || product.closed_at) {
      throw new Error('Can only unreject bidders for active auctions');
    }

    // Remove from rejected_bidders table
    await rejectedBidderModel.unrejectBidder(productId, bidderId);

    res.json({ success: true, message: 'Bidder can now bid on this product again' });
  } catch (error) {
    console.error('Error unrejecting bidder:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to unreject bidder' 
    });
  }
});

export default router;