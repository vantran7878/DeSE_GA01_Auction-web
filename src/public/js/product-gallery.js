let currentImageIndex = 0;

// Gallery Carousel Navigation
function galleryNext() {
  const thumbnails = document.querySelectorAll('.gallery-thumb');
  if (thumbnails.length > 0) {
    const nextIndex = (currentImageIndex + 1) % thumbnails.length;
    thumbnails[nextIndex].click();
  }
}

function galleryPrev() {
  const thumbnails = document.querySelectorAll('.gallery-thumb');
  if (thumbnails.length > 0) {
    const prevIndex = (currentImageIndex - 1 + thumbnails.length) % thumbnails.length;
    thumbnails[prevIndex].click();
  }
}

function changeMainImage(element, index) {
  const imgSrc = element.querySelector('img').src;
  document.getElementById('mainImage').src = imgSrc;
  currentImageIndex = index;
  document.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.classList.remove('active');
  });
  element.classList.add('active');
}

// Lightbox
function openLightbox(index) {
  currentImageIndex = index;
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  lightboxImage.src = galleryImages[index];
  document.getElementById('currentImageNum').textContent = index + 1;
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  document.getElementById('lightboxImage').src = galleryImages[currentImageIndex];
  document.getElementById('currentImageNum').textContent = currentImageIndex + 1;
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  document.getElementById('lightboxImage').src = galleryImages[currentImageIndex];
  document.getElementById('currentImageNum').textContent = currentImageIndex + 1;
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
  const lightbox = document.getElementById('lightbox');
  if (lightbox.style.display === 'flex') {
    if (event.key === 'ArrowLeft')  prevImage();
    if (event.key === 'ArrowRight') nextImage();
    if (event.key === 'Escape')      closeLightbox();
  }
});

window.addEventListener('load', function() {
  const mainImage = document.getElementById('mainImage');
  if (mainImage) {
    mainImage.addEventListener('click', () => openLightbox(currentImageIndex));
  }
});

// Toggle Description / Details sections
function toggleDescription() {
  const content = document.getElementById('descriptionContent');
  const toggle  = document.getElementById('descriptionToggle');
  const hidden  = content.style.display === 'none';
  content.style.display = hidden ? 'block' : 'none';
  toggle.innerHTML = hidden ? '<i class="bi bi-chevron-up"></i>'
                            : '<i class="bi bi-chevron-down"></i>';
}

function toggleDetails() {
  const content = document.getElementById('detailsContent');
  const toggle  = document.getElementById('detailsToggle');
  const hidden  = content.style.display === 'none';
  content.style.display = hidden ? 'block' : 'none';
  toggle.innerHTML = hidden ? '<i class="bi bi-chevron-up"></i>'
                            : '<i class="bi bi-chevron-down"></i>';
}