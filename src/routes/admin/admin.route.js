import express from 'express';
import adminAccountRouter from './account.route.js';
import adminUserRouter from './user.route.js';
import adminCategoryRouter from './category.route.js';
import adminProductRouter from './product.route.js';
import adminSystemRouter from './system.route.js';

const router = express.Router();

// Gộp tất cả admin routes
router.use('/account', adminAccountRouter);
router.use('/users', adminUserRouter);
router.use('/categories', adminCategoryRouter);
router.use('/products', adminProductRouter);
router.use('/system', adminSystemRouter);

export default router;
