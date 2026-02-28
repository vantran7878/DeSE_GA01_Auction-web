// const { productId } = window.PRODUCT_DATA;

function handleBidderAction(btn, config) {
  btn.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    const bidderId   = this.getAttribute('data-bidder-id');
    const bidderName = this.getAttribute('data-bidder-name');
    const self = this;

    Swal.fire({
      title:             config.confirmTitle,
      html:              config.confirmHtml(bidderName),
      icon:              config.icon,
      showCancelButton:  true,
      confirmButtonColor: config.confirmColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: config.confirmText,
      cancelButtonText:  'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;
      self.disabled = true;
      self.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

      fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, bidderId })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          Swal.fire({ title: config.successTitle, text: config.successText,
                      icon: 'success', confirmButtonColor: '#72AEC8' })
            .then(() => location.reload());
        } else {
          Swal.fire({ title: 'Error!', text: data.message || 'Something went wrong.',
                      icon: 'error', confirmButtonColor: '#72AEC8' });
          self.disabled = false;
          self.innerHTML = config.resetIcon;
        }
      })
      .catch(() => {
        Swal.fire({ title: 'Error!', text: 'Network error. Please try again.',
                    icon: 'error', confirmButtonColor: '#72AEC8' });
        self.disabled = false;
        self.innerHTML = config.resetIcon;
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.reject-bidder-btn').forEach(btn =>
    handleBidderAction(btn, {
      url:           '/products/reject-bidder',
      confirmTitle:  'Reject Bidder?',
      confirmHtml:   name => `Are you sure you want to reject <strong>"${name}"</strong>?`,
      icon:          'warning',
      confirmColor:  '#dc3545',
      confirmText:   'Yes, reject',
      successTitle:  'Rejected!',
      successText:   'The bidder has been rejected successfully.',
      resetIcon:     '<i class="bi bi-x-circle"></i>'
    })
  );
  document.querySelectorAll('.unreject-bidder-btn').forEach(btn =>
    handleBidderAction(btn, {
      url:           '/products/unreject-bidder',
      confirmTitle:  'Unban Bidder?',
      confirmHtml:   name => `Allow <strong>"${name}"</strong> to bid again?`,
      icon:          'question',
      confirmColor:  '#28a745',
      confirmText:   'Yes, allow',
      successTitle:  'Unbanned!',
      successText:   'The bidder can now bid on this product again.',
      resetIcon:     '<i class="bi bi-check-circle"></i> Unban'
    })
  );
});