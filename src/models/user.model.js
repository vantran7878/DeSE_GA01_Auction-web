import db from '../utils/db.js';

export async function add(user) {
  // PostgreSQL
  const rows = await db('users')
    .insert(user)
    .returning(['id', 'email', 'fullname', 'address', 'role', 'email_verified']);
  return rows[0]; // object: { id, email, fullname, ... }
}
export function findById(id) {
  return db('users').where('id', id).first();
}
export function loadAllUsers() {
  return db('users').orderBy('id', 'desc');
}

export function findUsersByRole(role) {
  return db('users')
    .select('users.id', 'users.fullname', 'users.email', 'users.role')
    .where('users.role', role)
    .orderBy('users.fullname', 'asc');
}

export function findByUserName(username) {
  return db('users').where('username', username).first();
}

export async function update(id, user) {
  // SỬA: Thêm await
  const rows = await db('users')
    .where('id', id)
    .update(user)
    .returning('*'); 
  
  return rows[0]; 
}

export function findByEmail(email) {
  return db('users').where('email', email).first();
}

/**
 * Kiểm tra xem user đã bid cho sản phẩm này chưa
 * @param {number} productId - ID sản phẩm
 * @param {number} bidderId - ID người đặt giá
 * @returns {Promise<boolean>} True nếu đã bid
 */
export async function hasUserBidOnProduct(productId, bidderId) {
  const result = await db('bidding_history')
    .where('product_id', productId)
    .where('bidder_id', bidderId)
    .first();
  return !!result;
}

/**
 * Lấy tất cả sản phẩm mà bidder đã thắng (pending, sold, cancelled)
 * @param {number} bidderId - ID người đặt giá
 * @returns {Promise<Array>} Danh sách sản phẩm
 */
export async function getWonAuctionsByBidderId(bidderId) {
  return db('products')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .leftJoin('users as seller', 'products.seller_id', 'seller.id')
    .where('products.highest_bidder_id', bidderId)
    .where(function() {
      this.where(function() {
        // Pending: (end_at <= NOW OR closed_at) AND is_sold IS NULL
        this.where(function() {
          this.where('products.end_at', '<=', new Date())
            .orWhereNotNull('products.closed_at');
        }).whereNull('products.is_sold');
      })
      .orWhere('products.is_sold', true)   // Sold
      .orWhere('products.is_sold', false); // Cancelled
    })
    .select(
      'products.*',
      'categories.name as category_name',
      'seller.fullname as seller_name',
      'seller.email as seller_email',
      db.raw(`
        CASE
          WHEN products.is_sold IS TRUE THEN 'Sold'
          WHEN products.is_sold IS FALSE THEN 'Cancelled'
          WHEN (products.end_at <= NOW() OR products.closed_at IS NOT NULL) AND products.is_sold IS NULL THEN 'Pending'
        END AS status
      `),
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    )
    .orderBy('products.end_at', 'desc');
}

// ===================== OTP USING KNEX =====================

// Tạo OTP
export function createOtp({ user_id, otp_code, purpose, expires_at }) {
  return db('user_otps').insert({
    user_id,
    otp_code,
    purpose,
    expires_at
  });
}

// Tìm OTP còn hiệu lực
export function findValidOtp({ user_id, otp_code, purpose }) {
  return db('user_otps')
    .where({
      user_id,
      otp_code,
      purpose,
      used: false
    })
    .andWhere('expires_at', '>', db.fn.now())
    .orderBy('id', 'desc')
    .first();
}

// Đánh dấu OTP đã dùng
export function markOtpUsed(id) {
  return db('user_otps')
    .where('id', id)
    .update({ used: true });
}

// Verify email user
export function verifyUserEmail(user_id) {
  return db('users')
    .where('id', user_id)
    .update({ email_verified: true });
}
export function updateUserInfo(user_id, { email, fullname, address }) {
  return db('users')
    .where('id', user_id)
    .update({ email, fullname, address });
}
export function markUpgradePending(user_id) {
  return db('users')
    .where('id', user_id)
    .update({ is_upgrade_pending: true });
}
export function updateUserRoleToSeller(user_id) {
  return db('users')
    .where('id', user_id)
    .update({ role: 'seller', is_upgrade_pending: false });
}

// ===================== OAUTH SUPPORT =====================

// Tìm user theo OAuth provider
export function findByOAuthProvider(provider, oauth_id) {
  return db('users')
    .where({
      oauth_provider: provider,
      oauth_id: oauth_id
    })
    .first();
}

// Thêm OAuth provider cho user hiện có
export function addOAuthProvider(user_id, provider, oauth_id) {
  return db('users')
    .where('id', user_id)
    .update({
      oauth_provider: provider,
      oauth_id: oauth_id,
      email_verified: true
    });
} 
export async function deleteUser(id) {
  return db('users')  
    .where('id', id)
    .del();
}
