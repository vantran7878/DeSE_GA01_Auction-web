import express from 'express';
import * as reviewModel from '../models/review.model.js';
import * as userModel from '../models/user.model.js';
const router = express.Router();

// EDIT: Fix DRY - Load rating page data for both seller and bidder
const loadRatingPageData = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const ratingData = await reviewModel.calculateRatingPoint(userId);
  const reviews = await reviewModel.getReviewsByUserId(userId);

  const positiveReviews = reviews.filter(r => r.rating === 1).length;
  const negativeReviews = reviews.filter(r => r.rating === -1).length;  

  return {
    user,
    rating_point: ratingData?.rating_point ||  0,
    reviews,
    totalReviews: reviews.length,
    positiveReviews,
    negativeReviews

  };
}

// ROUTE: Seller Ratings Page
router.get('/seller/:sellerId/ratings', async (req, res) => {
  try {
    const sellerId = parseInt(req.params.sellerId);
    
    if (!sellerId) {
      return res.redirect('/');
    }
    
    // Get seller info
    const data = await loadRatingPageData(sellerId);
    if (!data) return res.redirect('/');


    res.render('vwProduct/seller-ratings', {
      sellerName: data.user.fullname,
      rating_point: data.rating_point,
      totalReviews: data.totalReviews,
      positiveReviews: data.positiveReviews,
      negativeReviews: data.negativeReviews,
      reviews: data.reviews
    });
    
  } catch (error) {
    console.error('Error loading seller ratings page:', error);
    res.redirect('/');
  }
});

// ROUTE: Bidder Ratings Page
router.get('/bidder/:bidderId/ratings', async (req, res) => {
  try {
    const bidderId = parseInt(req.params.bidderId);
    
    if (!bidderId) {
      return res.redirect('/');
    }
    
    // Get bidder info
    const bidder = await userModel.findById(bidderId);
    if (!bidder) {
      return res.redirect('/');
    }
    
    // Get rating point
    const data = await loadRatingPageData(bidderId);
    if (!data) return res.redirect('/');

    // Mask bidder name
    const maskedName = bidder.fullname ? bidder.fullname.split('').map((char, index) => 
      index % 2 === 0 ? char : '*'
    ).join('') : '';
    
    res.render('vwProduct/bidder-ratings', {
      bidderName: maskedName,
      rating_point: data.rating_point,
      totalReviews: data.totalReviews,
      positiveReviews: data.positiveReviews,
      negativeReviews: data.negativeReviews,
      reviews: data.reviews
    });
    
  } catch (error) {
    console.error('Error loading bidder ratings page:', error);
    res.redirect('/');
  }
});

export default router;