// const { isAuthenticated, detailUrl } = window.PRODUCT_DATA;

document.querySelector('.btn-buy-now')?.addEventListener('click', function() {
  if (!isAuthenticated) {
    window.location.href = `/account/signin?retUrl=${detailUrl}`;
    return;
  }

  const productId    = this.getAttribute('data-product-id');
  const buyNowPrice  = parseFloat(this.getAttribute('data-buy-now-price'));
  const formatted   = buyNowPrice.toLocaleString('vi-VN');

  Swal.fire({
    title: '<strong>Confirm Buy Now Purchase</strong>',
    icon:  'warning',
    html: `
      <div style="text-align:left;padding:10px;">
        <p class="mb-3"><strong>Are you sure you want to purchase now?</strong></p>
        <div class="alert alert-info">
          <ul style="margin:8px 0 0;">
            <li>Price: <strong>${formatted} VND</strong></li>
            <li>Auction will <strong>end immediately</strong></li>
            <li>Status → <strong>pending payment</strong></li>
          </ul>
        </div>
        <div class="alert alert-warning mb-0">
          ⚠️ Failure to pay may result in a <strong class="text-danger">negative rating</strong>.
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText:  'Cancel',
    width: '600px',
    buttonsStyling: false,
    customClass: {
      confirmButton: 'swal-btn-confirm',
      cancelButton:  'swal-btn-cancel',
      actions:       'd-flex justify-content-center gap-3'
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'Processing...', allowOutsideClick: false,
                didOpen: () => Swal.showLoading() });

    fetch('/products/buy-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Success!', html: data.message,
                    confirmButtonColor: '#72AEC8', confirmButtonText: 'Proceed to Payment' })
          .then(() => window.location.href = data.redirectUrl || location.href);
      } else {
        Swal.fire({ icon: 'error', title: 'Error',
                    text: data.message || 'Failed to purchase', confirmButtonColor: '#72AEC8' });
      }
    })
    .catch(() => Swal.fire({ icon: 'error', title: 'Error',
                              text: 'Network error. Please try again.', confirmButtonColor: '#72AEC8' }));
  });
});