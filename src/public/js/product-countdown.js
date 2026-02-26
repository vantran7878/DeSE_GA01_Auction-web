function initProductCountdown() {
  const el = document.querySelector('.countdown-timer');
  if (!el) return;

  const THREE_DAYS = 3 * 24 * 3600000;
  let ended = false;

  function update() {
    const diff = new Date(el.dataset.endDate) - new Date();

    if (diff <= 0) {
      el.textContent = 'Auction Ended';
      el.classList.remove('text-danger'); el.classList.add('text-muted');
      if (!ended) { ended = true; setTimeout(() => location.reload(), 1000); }
      return;
    }

    if (diff > THREE_DAYS) {
      // Hiển thị ngày kết thúc (không đếm ngược)
      const endDate = new Date(el.dataset.endDate);
      el.innerHTML = endDate.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
        + '<br>'
        + endDate.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
      el.classList.remove('text-danger'); el.classList.add('text-primary');
      const label = el.closest('.info-box')?.querySelector('small.text-muted');
      if (label) label.textContent = 'Ends at';
      return;
    }

    // Đếm ngược real-time
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff % 86400000 / 3600000);
    const m = Math.floor(diff % 3600000  / 60000);
    const s = Math.floor(diff % 60000    / 1000);

    el.textContent = d > 0 ? `${d}d ${h}h ${m}m ${s}s`
      : h > 0 ? `${h}h ${m}m ${s}s`
      : m > 0 ? `${m}m ${s}s`
      : `${s}s`;
    el.classList.remove('text-primary'); el.classList.add('text-danger');
    if (d === 0 && h < 1) el.classList.add('fw-bold');
    const label = el.closest('.info-box')?.querySelector('small.text-muted');
    if (label) label.textContent = 'Time Left';
  }

  update();
  setInterval(update, 1000);
}