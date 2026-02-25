import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import methodOverride from 'method-override';
import passport from './utils/passport.js';
import './config/storage.js';

// Import Scheduled Jobs
import { startAuctionEndNotifier } from './scripts/auctionEndNotifier.js';

// Import Routes
import homeRouter from './routes/home.route.js';
import productRouter from './routes/product.route.js';
import accountRouter from './routes/account.route.js';
import adminRouter from './routes/admin/admin.route.js'
import sellerRouter from './routes/seller.route.js';
// Import Middlewares
import { isAuthenticated, isSeller, isAdmin } from './middlewares/auth.mdw.js';
import { configViewEngine } from './config/view_engine.js';
import { userInfoMiddleware } from './middlewares/user.mdw.js';
import { categoryMiddleware } from './middlewares/category.mdw.js'


const app = express();
const PORT = process.env.PORT || 3005;

// ============================================================
// 1. CẤU HÌNH CỐT LÕI
// ============================================================
app.use('/static', express.static('public'));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // false chạy localhost
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// 2. CẤU HÌNH VIEW ENGINE (Handlebars)
// ============================================================
configViewEngine(app)

// ============================================================
// 3. MIDDLEWARE TOÀN CỤC (Chạy cho mọi request)
// ============================================================

// 3.1. Middleware User Info
app.use(userInfoMiddleware);

// 3.2. Middleware Category (Chỉ load cho Client)
app.use(categoryMiddleware);

// ============================================================
// 4. CẤU HÌNH LOGIC ADMIN (Design Pattern)
// ============================================================

// A. Bảo mật trước tiên: Mọi route /admin/* phải qua cửa kiểm soát

app.use('/admin', isAdmin);

// B. Thiết lập giao diện Admin (Bật cờ để Layout biết đường hiển thị Sidebar)
app.use('/admin', function (req, res, next) {
    res.locals.isAdminMode = true; 
    next();
});

// ============================================================
// 5. ROUTES
// ============================================================

// Các Route Admin
app.use('/admin', adminRouter);
// Các Route Seller
app.use('/seller', isAuthenticated, isSeller, sellerRouter);

// API endpoint for categories (for search modal)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    // Add level information based on parent_id
    const categoriesWithLevel = categories.map(cat => ({
      ...cat,
      level: cat.parent_id ? 2 : 1
    }));
    res.json({ categories: categoriesWithLevel });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Các Route Client (Đặt cuối cùng để tránh override)
app.use('/', homeRouter);
app.use('/products', productRouter);
app.use('/account', accountRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Start scheduled jobs
  startAuctionEndNotifier(30); // Check every 30 seconds for ended auctions
});