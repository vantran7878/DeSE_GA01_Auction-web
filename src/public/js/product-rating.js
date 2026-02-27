function openSellerRatingsModal(sellerId, sellerName) {
  document.getElementById('sellerNameTitle').textContent = sellerName + "'s Ratings";

  const modal = new bootstrap.Modal(document.getElementById('sellerRatingsModal'));
  modal.show();

  document.getElementById('ratingsLoading').style.display = 'block';
  document.getElementById('ratingsError').style.display   = 'none';
  document.getElementById('ratingsContent').style.display  = 'none';

  fetch(`/products/api/seller-ratings/${sellerId}`)
    .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
    .then(data => {
      document.getElementById('ratingsLoading').style.display = 'none';
      document.getElementById('ratingsContent').style.display  = 'block';

      const rp = data.rating_point || 0;
      document.getElementById('overallRating').textContent    = rp === 1 ? '100.00%' : (rp * 100).toFixed(2) + '%';
      document.getElementById('totalReviewsCount').textContent  = data.totalReviews || 0;
      document.getElementById('positiveCount').textContent     = data.positiveReviews || 0;
      document.getElementById('negativeCount').textContent     = data.negativeReviews || 0;
      document.getElementById('totalReviewsText').textContent  = `Based on ${data.totalReviews || 0} review(s)`;

      const list  = document.getElementById('reviewsList');
      const empty = document.getElementById('emptyState');

      if (data.reviews?.length) {
        list.innerHTML = data.reviews.map(review => `
          <div class="card mb-3 border-0"
               style="background:${review.rating===1?'rgba(40,167,69,.05)':'rgba(220,53,69,.05)'};
                      border-left:4px solid ${review.rating===1?'#28a745':'#dc3545'} !important">
            <div class="card-body">
              <div class="row align-items-start">
                <div class="col-md-3 mb-2">
                  <div class="d-flex align-items-center">
                    <div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style="width:35px;height:35px;">
                      <i class="bi bi-person-fill"></i>
                    </div>
                    <div>
                      <div class="fw-bold small">${review.reviewer_name}</div>
                      <small class="text-muted">${new Date(review.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 mb-2">
                  <small class="text-muted d-block mb-1">Product</small>
                  <div class="small"><i class="bi bi-box-seam me-1"></i>${review.product_name}</div>
                </div>
                <div class="col-md-2 mb-2">
                  <span class="badge ${review.rating===1?'bg-success':'bg-danger'} px-2 py-1">
                    <i class="bi bi-hand-thumbs-${review.rating===1?'up':'down'}-fill me-1"></i>
                    ${review.rating===1?'Positive':'Negative'}
                  </span>
                </div>
                <div class="col-md-3">
                  ${review.comment
                    ? `<div class="bg-white p-2 rounded"><small class="text-muted d-block mb-1"><i class="bi bi-chat-left-quote-fill me-1"></i>Comment</small><p class="mb-0 small">${review.comment}</p></div>`
                    : '<small class="text-muted fst-italic">No comment</small>'}
                </div>
              </div>
            </div>
          </div>
        `).join('');
        empty.style.display = 'none';
      } else {
        list.innerHTML = '';
        empty.style.display = 'block';
      }
    })
    .catch(() => {
      document.getElementById('ratingsLoading').style.display = 'none';
      document.getElementById('ratingsError').style.display   = 'block';
    });
}