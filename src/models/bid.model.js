/**
 * Thêm một lượt bid mới vào hệ thống
 * @param {number} productId - ID sản phẩm
 * @param {number} bidderId - ID người đặt giá
 * @param {number} currentPrice - Giá hiện tại của sản phẩm sau khi update
 * @returns {Promise} Kết quả insert
 */
export async function createBid(productId, bidderId, currentPrice) {
  return db('bidding_history').insert({
    product_id: productId,
    bidder_id: bidderId,
    current_price: currentPrice
  }).returning('*');
}