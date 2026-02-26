function initCountdowns(selector = '.countdown-timer') {
  function update() {
    document.querySelectorAll(selector).forEach(el => {
      const endDate = new Date(el.dataset.endDate);
      const diff = endDate - new Date();
      if (diff <= 0) {
        el.textContent = 'Ended';
        el.classList.replace('text-danger', 'text-muted');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = d > 0 ? `${d}d ${h}h ${m}m`
        : h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : m > 0 ? `${m}:${String(s).padStart(2,'0')}`
        : `${s}s`;
    });
  }
  update();
  setInterval(update, 1000);
}