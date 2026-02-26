import db from '../utils/db.js';

/**
 * Lấy tất cả sản phẩm mà bidder đang tham gia đấu giá
 * @param {number} bidderId - ID người đặt giá
 * @returns {Promise<Array>} Danh sách sản phẩm
 */
export async function getBiddingProductsByBidderId(bidderId) {
  return db('auto_bidding')
    .join('products', 'auto_bidding.product_id', 'products.id')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .where('auto_bidding.bidder_id', bidderId)
    .where('products.end_at', '>', new Date())
    .whereNull('products.closed_at')
    .select(
      'products.*',
      'categories.name as category_name',
      'auto_bidding.max_price as my_max_bid',
      db.raw(`
        CASE 
          WHEN products.highest_bidder_id = ? THEN true 
          ELSE false 
        END AS is_winning
      `, [bidderId]),
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    )
    .orderBy('products.end_at', 'asc');
}