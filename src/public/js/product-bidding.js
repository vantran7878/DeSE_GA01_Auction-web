const bidModal = new bootstrap.Modal(document.getElementById('bidModal'));

// Đọc từ biến toàn cục được inject bởi template
const { currentPrice, productId, minIncrement, isAuthenticated, detailUrl } = window.PRODUCT_DATA;

function formatNumberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function removeCommas(str) {
  return str.replace(/,/g, '');
}

// Open bid modal
document.querySelector('.btn-place-bid')?.addEventListener('click', function() {
  if (isAuthenticated) {
    const suggestedBid = currentPrice + minIncrement;
    const bidInput = document.getElementById('bidAmount');
    bidInput.value = formatNumberWithCommas(suggestedBid);
    bidInput.setAttribute('data-raw-value', suggestedBid);
    bidModal.show();
  } else {
    window.location.href = `/account/signin?retUrl=${detailUrl}`;
  }
});

// Long-press functionality
let pressTimer = null, isLongPress = false, repeatInterval = null;

function adjustBid(amount) {
  const bidInput = document.getElementById('bidAmount');
  let cur = parseInt(bidInput.getAttribute('data-raw-value')) || (currentPrice + minIncrement);
  const newBid = Math.max(currentPrice + minIncrement, cur + amount);
  bidInput.setAttribute('data-raw-value', newBid);
  bidInput.value = formatNumberWithCommas(newBid);
  bidInput.setCustomValidity('');
}

function startPress(direction) {
  isLongPress = false;
  pressTimer = setTimeout(() => {
    isLongPress = true;
    repeatInterval = setInterval(() => adjustBid(direction * minIncrement), 100);
  }, 500);
}

function stopPress() {
  clearTimeout(pressTimer);
  clearInterval(repeatInterval);
}

// Increase / Decrease buttons
['increase', 'decrease'].forEach(dir => {
  const btn = document.getElementById(`${dir}Bid`);
  const amount = dir === 'increase' ? 1 : -1;
  btn?.addEventListener('mousedown',  () => startPress(amount));
  btn?.addEventListener('touchstart', () => startPress(amount));
  btn?.addEventListener('mouseup', () => { stopPress(); if (!isLongPress) adjustBid(amount * minIncrement); });
  btn?.addEventListener('touchend', () => { stopPress(); if (!isLongPress) adjustBid(amount * minIncrement); });
  btn?.addEventListener('mouseleave', stopPress);
});

// Quick increment/decrement buttons
document.querySelectorAll('.quick-increment').forEach(btn =>
  btn.addEventListener('click', () => adjustBid(minIncrement * parseInt(btn.dataset.multiplier)))
);
document.querySelectorAll('.quick-decrement').forEach(btn =>
  btn.addEventListener('click', () => adjustBid(-minIncrement * parseInt(btn.dataset.multiplier)))
);

// Input formatting
document.getElementById('bidAmount')?.addEventListener('input', function() {
  let value = removeCommas(this.value).replace(/[^\d]/g, '');
  if (!value) { this.value = ''; this.setAttribute('data-raw-value', '0'); return; }
  const num = parseInt(value);
  this.setAttribute('data-raw-value', num);
  this.value = formatNumberWithCommas(num);
  const minBid = currentPrice + minIncrement;
  this.setCustomValidity(num < minBid ? `Giá tối thiểu ${formatNumberWithCommas(minBid)} VND` : '');
});

// Confirmation checkbox
const confirmCheck = document.getElementById('confirmBidCheckbox');
const submitBtn   = document.getElementById('submitBidBtn');
if (confirmCheck && submitBtn) {
  confirmCheck.addEventListener('change', function() {
    submitBtn.disabled = !this.checked;
    submitBtn.style.opacity = this.checked ? '1' : '0.6';
  });
  document.getElementById('bidModal')?.addEventListener('hidden.bs.modal', () => {
    confirmCheck.checked = false;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
  });
}

// Bid form submit
document.getElementById('bidForm')?.addEventListener('submit', function() {
  const bidInput   = document.getElementById('bidAmount');
  const hiddenInput = document.getElementById('bidAmountRaw');
  if (hiddenInput) hiddenInput.value = bidInput.getAttribute('data-raw-value') || removeCommas(bidInput.value);
  submitBtn.disabled = true;
  submitBtn.classList.add('processing');
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
});