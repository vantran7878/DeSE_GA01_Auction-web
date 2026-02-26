import express from 'express';
//import * as productModel from '../models/product.model.js';
//import * as reviewModel from '../models/review.model.js';
//import * as userModel from '../models/user.model.js';
//import * as watchListModel from '../models/watchlist.model.js';
//import * as biddingHistoryModel from '../models/biddingHistory.model.js';
//import * as productCommentModel from '../models/productComment.model.js';
//import * as categoryModel from '../models/category.model.js';
//import * as productDescUpdateModel from '../models/productDescriptionUpdate.model.js';
////import * as autoBiddingModel from '../models/autoBidding.model.js';
//import * as systemSettingModel from '../models/systemSetting.model.js';
//import * as rejectedBidderModel from '../models/rejectedBidder.model.js';
//import * as orderModel from '../models/order.model.js';
//import * as invoiceModel from '../models/invoice.model.js';
//import * as orderChatModel from '../models/orderChat.model.js';
//import { isAuthenticated } from '../middlewares/auth.mdw.js';
//import { sendMail } from '../utils/mailer.js';
//import db from '../utils/db.js';
//import multer from 'multer';
//import path from 'path';

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