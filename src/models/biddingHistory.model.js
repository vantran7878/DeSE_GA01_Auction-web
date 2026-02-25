import db from '../utils/db.js';


/**
 * Lấy lịch sử đấu giá của một sản phẩm
 * @param {number} productId - ID sản phẩm
 * @returns {Promise<Array>} Danh sách lịch sử bid
 */
export async function getBiddingHistory(productId) {
  return db('bidding_history')
    .join('users', 'bidding_history.bidder_id', 'users.id')
    .where('bidding_history.product_id', productId)
    .select(
      'bidding_history.id',
      'bidding_history.product_id',
      'bidding_history.bidder_id',
      'bidding_history.current_price',
      'bidding_history.created_at',
      'bidding_history.is_buy_now',
      db.raw(`mask_name_alternating(users.fullname) AS bidder_name`)
    )
    .orderBy('bidding_history.created_at', 'desc');
}

