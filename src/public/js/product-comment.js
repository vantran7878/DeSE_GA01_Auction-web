const commentForm = document.querySelector('.comment-form form');
if (commentForm) {
  commentForm.addEventListener('submit', function(e) {
    const btn = this.querySelector('button[type="submit"]');
    if (btn.disabled) { e.preventDefault(); return false; }
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Posting...';
    setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 3000);
  });
}

// Reply buttons
document.querySelectorAll('.reply-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const id   = this.getAttribute('data-comment-id');
    const name = this.getAttribute('data-user-name');
    const form  = document.getElementById(`reply-form-${id}`);
    const input = form.querySelector('.reply-input');
    if (name && input) {
      input.innerHTML = `<span class="mention">@${name}</span> `;
      input.focus();
      const range = document.createRange();
      range.selectNodeContents(input); range.collapse(false);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    form.style.display = 'block';
    this.style.display = 'none';
  });
});

// Cancel reply
document.querySelectorAll('.cancel-reply').forEach(btn => {
  btn.addEventListener('click', function() {
    const id   = this.getAttribute('data-comment-id');
    const form = document.getElementById(`reply-form-${id}`);
    const replyBtn = document.querySelector(`.reply-btn[data-comment-id="${id}"]`);
    const input = form.querySelector('.reply-input');
    if (input) input.innerHTML = '';
    form.style.display = 'none';
    replyBtn.style.display = 'inline-block';
  });
});

// Sync contenteditable → hidden input khi submit
document.querySelectorAll('.reply-input').forEach(editor => {
  const form = editor.closest('form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    const btn = form.querySelector('button[type="submit"]');
    if (btn?.disabled) { e.preventDefault(); return false; }
    const hidden = form.querySelector('.reply-content-hidden');
    if (hidden) hidden.value = editor.textContent;
    if (btn) {
      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
      setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 3000);
    }
  });
});