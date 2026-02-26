import express from 'express';

import * as productDescUpdateModel from '../models/productDescriptionUpdate.model.js';
import * as productCommentModel from '../models/productComment.model.js';
import * as productModel from '../models/product.model.js';
import * as reviewModel from '../models/review.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as rejectedBidderModel from '../models/rejectedBidder.model.js';

const router = express.Router();


const determineProductStatus = (product, now) => {
  const endDate = new Date(product.end_at);
  if (product.is_sold === true) return 'SOLD';
  if (product.is_sold === false) return 'CANCELLED';
  if ((endDate <= now || product.closed_at) && product.highest_bidder_id) return 'PENDING';
  if (endDate <= now && !product.highest_bidder_id) return 'EXPIRED';
  if (endDate > now && !product.closed_at) return 'ACTIVE';
}

router.get('/detail', async (req, res) => {
  const userId = req.session.authUser ? req.session.authUser.id : null;
  const productId = req.query.id;
  const product = await productModel.findByProductId2(productId, userId);
  const related_products = await productModel.findRelatedProducts(productId);
  
  // Kiểm tra nếu không tìm thấy sản phẩm
  if (!product) {
    return res.status(404).render('404', { message: 'Product not found' });
  }
  console.log('Product details:', product);
  // Determine product status
  const now = new Date();
  const endDate = new Date(product.end_at);
  
  //EDITED: Autoclose if expired
  if (endDate <= now && !product.closed_at && product.is_sold === null) {
      await productModel.updateProduct(productId, { closed_at: endDate });
      product.closed_at = endDate; // Update local object to reflect change
  }
  
  //DRY fixed for if statement and status determination
  const productStatus = determineProductStatus(product, now);

  // Edited, DRY fixed: 
  // Authorization check: Non-ACTIVE products can only be viewed by seller or highest bidder
  if (productStatus !== 'ACTIVE') {
    if (!userId) {
      // User not logged in, cannot view non-active products
      return res.status(403).render('403', { message: 'You do not have permission to view this product' });
    }
    
    const isSeller = product.seller_id === userId;
    const isHighestBidder = product.highest_bidder_id === userId;

    console.log(`Product status: ${productStatus}, isSeller: ${isSeller}, seller_id: ${product.seller_id}, user_id: ${userId}, isHighestBidder: ${isHighestBidder}`);

    
    if (!isSeller && !isHighestBidder) {
      return res.status(403).render('403', { message: 'You do not have permission to view this product' });
    }
  }

  // Pagination for comments
  const commentPage = parseInt(req.query.commentPage) || 1;
  const commentsPerPage = 2; // 2 comments per page
  const offset = (commentPage - 1) * commentsPerPage;

  // Load description updates, bidding history, and comments in parallel
  const [descriptionUpdates, biddingHistory, comments, totalComments] = await Promise.all([
    productDescUpdateModel.findByProductId(productId),
    biddingHistoryModel.getBiddingHistory(productId),
    productCommentModel.getCommentsByProductId(productId, commentsPerPage, offset),
    productCommentModel.countCommentsByProductId(productId)
  ]);

  // Load rejected bidders (only for seller)
  let rejectedBidders = [];
  if (req.session.authUser && product.seller_id === req.session.authUser.id) {
    rejectedBidders = await rejectedBidderModel.getRejectedBidders(productId);
  }
  
  // Load replies for all comments in one batch to avoid N+1 query problem
  if (comments.length > 0) {
    const commentIds = comments.map(c => c.id);
    const allReplies = await productCommentModel.getRepliesByCommentIds(commentIds);
    
    // Group replies by parent comment id
    const repliesMap = new Map();
    for (const reply of allReplies) {
      if (!repliesMap.has(reply.parent_id)) {
        repliesMap.set(reply.parent_id, []);
      }
      repliesMap.get(reply.parent_id).push(reply);
    }
    
    // Attach replies to their parent comments
    for (const comment of comments) {
      comment.replies = repliesMap.get(comment.id) || [];
    }
  }
  
  // Calculate total pages
  const totalPages = Math.ceil(totalComments / commentsPerPage);
  
  // Get flash messages from session
  const success_message = req.session.success_message;
  const error_message = req.session.error_message;
  delete req.session.success_message;
  delete req.session.error_message;

  // Get seller rating
  const sellerRatingObject = await reviewModel.calculateRatingPoint(product.seller_id);
  const sellerReviews = await reviewModel.getReviewsByUserId(product.seller_id);
  
  // Get bidder rating (if exists)
  let bidderRatingObject = { rating_point: null };
  let bidderReviews = [];
  if (product.highest_bidder_id) {
    bidderRatingObject = await reviewModel.calculateRatingPoint(product.highest_bidder_id);
    bidderReviews = await reviewModel.getReviewsByUserId(product.highest_bidder_id);
  }
  
  // Check if should show payment button (for seller or highest bidder when status is PENDING)
  let showPaymentButton = false;
  if (req.session.authUser && productStatus === 'PENDING') {
    const userId = req.session.authUser.id;
    showPaymentButton = (product.seller_id === userId || product.highest_bidder_id === userId);
  }
  
  res.render('vwProduct/details', { 
    product,
    productStatus, // Pass status to view
    authUser: req.session.authUser, // Pass authUser for checking highest_bidder_id
    descriptionUpdates,
    biddingHistory,
    rejectedBidders,
    comments,
    success_message,
    error_message,
    related_products,
    seller_rating_point: sellerRatingObject.rating_point,
    seller_has_reviews: sellerReviews.length > 0,
    bidder_rating_point: bidderRatingObject.rating_point,
    bidder_has_reviews: bidderReviews.length > 0,
    commentPage,
    totalPages,
    totalComments,
    showPaymentButton
  });
});

export default router;