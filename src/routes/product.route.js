import express from 'express';

import listRoutes from './product-list.route.js';
import detailRoutes from './product-detail.route.js';
import bidRoutes from './bidding.route.js';
import buyRoutes from './product-buy.route.js';
import bidRejectRoutes from './bidding-reject.route.js';
import orderRoutes from './order.route.js';
import ratingRoutes from './rating.route.js';

const router = express.Router();

// Mount sub-routers
router.use('/', listRoutes);
router.use('/', detailRoutes);
router.use('/', bidRoutes);
router.use('/', buyRoutes);
router.use('/', bidRejectRoutes);
router.use('/', orderRoutes);
router.use('/', ratingRoutes);


export default router;