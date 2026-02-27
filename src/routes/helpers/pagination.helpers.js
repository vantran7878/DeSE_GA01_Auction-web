// routes/helpers/pagination.helper.js
// Shared pagination logic for ALL route files

export const calculatePagination = (total, page = 1, limit = 3) => {
  const count = Number(total?.count || total) || 0;
  const nPages = Math.ceil(count / limit);
  let from = (page - 1) * limit + 1;
  let to = page * limit;
  if (to > count) to = count;
  if (count === 0) { from = 0; to = 0; }
  return { 
    totalCount: count, 
    from, 
    to, 
    currentPage: page, 
    totalPages: nPages 
  };
};