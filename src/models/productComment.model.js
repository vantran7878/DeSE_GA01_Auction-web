import db from '../utils/db.js';

/**
 * Tạo comment mới cho sản phẩm
 */
export async function createComment(productId, userId, content, parentId = null) {
  return db('product_comments').insert({
    product_id: productId,
    user_id: userId,
    content: content,
    parent_id: parentId,
    created_at: new Date()
  }).returning('*');
}

/**
 * Lấy tất cả comments của sản phẩm với pagination
 */
export async function getCommentsByProductId(productId, limit = null, offset = 0) {
  let query = db('product_comments')
    .join('users', 'product_comments.user_id', 'users.id')
    .where('product_comments.product_id', productId)
    .whereNull('product_comments.parent_id')
    .select(
      'product_comments.*',
      'users.fullname as user_name',
      'users.role as user_role'
    )
    .orderBy('product_comments.created_at', 'desc');
  
  if (limit !== null) {
    query = query.limit(limit).offset(offset);
  }
  
  return query;
}

/**
 * Đếm tổng số parent comments của sản phẩm
 */
export async function countCommentsByProductId(productId) {
  const result = await db('product_comments')
    .where('product_id', productId)
    .whereNull('parent_id')
    .count('* as count')
    .first();
  return parseInt(result.count);
}

/**
 * Lấy replies của nhiều comments cùng lúc (batch query để tránh N+1 problem)
 * @param {Array<number>} commentIds - Mảng các comment IDs
 * @returns {Promise<Array>} Danh sách replies
 */
export async function getRepliesByCommentIds(commentIds) {
  if (!commentIds || commentIds.length === 0) {
    return [];
  }
  
  return db('product_comments')
    .join('users', 'product_comments.user_id', 'users.id')
    .whereIn('product_comments.parent_id', commentIds)
    .select(
      'product_comments.*',
      'users.fullname as user_name',
      'users.role as user_role'
    )
    .orderBy('product_comments.created_at', 'asc');
}

/**
 * Lấy danh sách unique commenters của một sản phẩm (với email)
 * @param {number} productId - ID sản phẩm
 * @returns {Promise<Array>} Danh sách commenters với email
 */
export async function getUniqueCommenters(productId) {
  return db('product_comments')
    .join('users', 'product_comments.user_id', 'users.id')
    .where('product_comments.product_id', productId)
    .distinct('users.id', 'users.email', 'users.fullname')
    .select('users.id', 'users.email', 'users.fullname');
}
