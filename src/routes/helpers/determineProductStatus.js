const determineProductStatus = (product) => {
  const now = new Date();
  const endDate = new Date(product.end_at);

  if (product.is_sold === true) return 'SOLD';
  if (product.is_sold === false) return 'CANCELLED';
  if ((endDate <= now || product.closed_at) && product.highest_bidder_id) return 'PENDING';
  if (endDate <= now && !product.highest_bidder_id) return 'EXPIRED';
  if (endDate > now && !product.closed_at) return 'ACTIVE';
  return 'ACTIVE';
};