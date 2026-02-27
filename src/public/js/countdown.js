function initCountdowns(selector) {
  const sel = selector || '.countdown-timer';

  function formatTime(diff) {
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (m > 0) return `${m}:${String(s).padStart(2,'0')}`;
    return `${s}s`;
  }

  function update() {
    document.querySelectorAll(sel).forEach(el => {
      const endDate = new Date(el.getAttribute('data-end-date'));
      const now = new Date();
      const diff = endDate - now;
      if (diff <= 0) {
        el.textContent = 'Ended';
        el.classList.remove('text-danger');
        el.classList.add('text-muted');
        return;
      }
      el.textContent = formatTime(diff);
      if (diff < 3600000) {  // < 1 giờ: đỏ + đậm
        el.classList.remove('text-danger');
        el.classList.add('text-danger', 'fw-bold');
      }
    });
  }

  update();
  return setInterval(update, 1000);
}