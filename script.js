/* =============================================
   PORTFOLIO JAVASCRIPT
   File: script.js
   ============================================= */

/* ── CAROUSEL ─────────────────────────────── */
(function initCarousel() {
  // Scope all queries to the hero carousel frame — avoids duplicate-ID issues
  const frame  = document.getElementById('heroCarouselFrame');
  const track  = document.getElementById('carouselTrack');
  const dotsEl = document.getElementById('carouselDots');

  if (!frame || !track || !dotsEl) return;

  // Use scoped queries so stray buttons elsewhere on the page are ignored
  const prev = frame.querySelector('.carousel-prev');
  const next = frame.querySelector('.carousel-next');

  if (!prev || !next) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const total  = slides.length;
  let current  = 0;
  let autoTimer;

  /* --- Auto-show real images, hide placeholders --- */
  slides.forEach(slide => {
    const img         = slide.querySelector('.carousel-img');
    const placeholder = slide.querySelector('.carousel-placeholder');
    if (!img) return;

    const src = img.getAttribute('src');
    if (src && src !== '') {
      img.onload = () => {
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      };
      img.onerror = () => {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      };
      // Trigger for already-cached images
      if (img.complete && img.naturalWidth > 0) {
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      }
    } else {
      img.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }
  });

  /* --- Build dot indicators --- */
  const dots = [];
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
    dots.push(dot);
  });

  /* --- Core navigation --- */
  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    resetAuto();
  }

  function goNext() { goTo(current + 1); }
  function goPrev() { goTo(current - 1); }

  prev.addEventListener('click', goPrev);
  next.addEventListener('click', goNext);

  /* --- Auto-advance every 4 s --- */
  function startAuto() {
    autoTimer = setInterval(goNext, 4000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  /* --- Touch / swipe support --- */
  let touchStartX = 0;

  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
    }
  }, { passive: true });

  /* --- Keyboard arrow support --- */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'ArrowRight') goNext();
  });

  startAuto();
})();


/* ── PROJECT IMAGE AUTO-SHOW ──────────────── */
(function initProjectImages() {
  document.querySelectorAll('.proj-img').forEach(img => {
    const placeholder = img.parentElement.querySelector('.project-img-placeholder');
    const src = img.getAttribute('src');

    if (src && src !== '') {
      img.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';

      img.onerror = () => {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      };
    } else {
      img.style.display = 'none';
    }
  });
})();


/* ── LIGHTBOX WITH NAVIGATION ─────────────── */
(function initLightbox() {
  // Build lightbox DOM
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close">✕</button>
    <button class="lightbox-nav lightbox-nav-prev" aria-label="Previous">&#8592;</button>
    <img src="" alt="Gallery photo">
    <button class="lightbox-nav lightbox-nav-next" aria-label="Next">&#8594;</button>
    <div class="lightbox-counter"></div>
  `;
  document.body.appendChild(lb);

  const lbImg     = lb.querySelector('img');
  const lbClose   = lb.querySelector('.lightbox-close');
  const lbPrev    = lb.querySelector('.lightbox-nav-prev');
  const lbNext    = lb.querySelector('.lightbox-nav-next');
  const lbCounter = lb.querySelector('.lightbox-counter');

  let images  = []; // array of { src, alt }
  let current = 0;

  /* --- Collect all real images from a carousel or container --- */
  function getSiblingImages(clickedImg) {
    // Walk up to find the nearest carousel/gallery container
    const carousel = clickedImg.closest('[data-proj-carousel], [data-act-carousel], .activity-gallery, #heroCarouselFrame');
    if (carousel) {
      const imgEls = Array.from(carousel.querySelectorAll('.proj-slide-img, .act-slide-img, .gallery-img, .carousel-img'));
      return imgEls
        .filter(img => img.src && img.src !== window.location.href && img.style.display !== 'none' && img.naturalWidth > 0)
        .map(img => ({ src: img.src, alt: img.alt || '' }));
    }
    // Fallback: just this image
    return [{ src: clickedImg.src, alt: clickedImg.alt || '' }];
  }

  function showImage(index) {
    current = (index + images.length) % images.length;
    lbImg.src = images[current].src;
    lbImg.alt = images[current].alt;
    // Show counter only when there are multiple images
    if (images.length > 1) {
      lbCounter.textContent = (current + 1) + ' / ' + images.length;
      lbCounter.style.display = 'block';
      lbPrev.style.display = 'flex';
      lbNext.style.display = 'flex';
    } else {
      lbCounter.style.display = 'none';
      lbPrev.style.display = 'none';
      lbNext.style.display = 'none';
    }
  }

  function openLightbox(clickedImg) {
    images  = getSiblingImages(clickedImg);
    current = images.findIndex(i => i.src === clickedImg.src);
    if (current === -1) current = 0;
    showImage(current);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
    images = [];
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', e => { e.stopPropagation(); showImage(current - 1); });
  lbNext.addEventListener('click', e => { e.stopPropagation(); showImage(current + 1); });

  lb.addEventListener('click', e => {
    if (e.target === lb || e.target === lbImg) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   showImage(current - 1);
    if (e.key === 'ArrowRight')  showImage(current + 1);
  });

  // Touch swipe inside lightbox
  let touchStartX = 0;
  lbImg.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lbImg.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? showImage(current + 1) : showImage(current - 1);
  }, { passive: true });

  // Delegate clicks — all image types
  document.addEventListener('click', e => {
    const img = e.target;
    const isClickable = img.tagName === 'IMG' && (
      img.classList.contains('gallery-img') ||
      img.classList.contains('act-slide-img') ||
      img.classList.contains('proj-slide-img') ||
      img.classList.contains('carousel-img')
    );
    if (isClickable && img.src && img.style.display !== 'none' && img.naturalWidth > 0) {
      openLightbox(img);
    }
  });
})();


/* ── SCROLL FADE-IN ANIMATIONS ────────────── */
(function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  document.querySelectorAll('.projects-grid .project-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 0.08) + 's';
    card.classList.add('fade-in');
    observer.observe(card);
  });

  document.querySelectorAll('.activity-item').forEach((item, i) => {
    item.style.transitionDelay = (i * 0.06) + 's';
  });
})();


/* ── ACTIVE NAV HIGHLIGHT ON SCROLL ──────── */
(function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + id
            ? 'var(--teal)'
            : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
})();


/* ── PROJECT CARD CAROUSELS ───────────────── */
(function initProjectCarousels() {
  document.querySelectorAll('[data-proj-carousel]').forEach(function(carousel) {
    const track = carousel.querySelector('.proj-carousel-track');
    const slides = carousel.querySelectorAll('.proj-carousel-slide');
    const prevBtn = carousel.querySelector('.proj-carousel-prev');
    const nextBtn = carousel.querySelector('.proj-carousel-next');
    const dotsEl = carousel.querySelector('.proj-carousel-dots');

    if (!track || slides.length === 0) return;

    const total = slides.length;
    let current = 0;

    /* --- Show real images, hide placeholders --- */
    slides.forEach(function(slide) {
      const img = slide.querySelector('.proj-slide-img');
      const placeholder = slide.querySelector('.proj-slide-placeholder');
      if (!img) return;

      const src = img.getAttribute('src');
      if (src && src !== '') {
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';

        img.onload = function() {
          img.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        };
        img.onerror = function() {
          img.style.display = 'none';
          if (placeholder) placeholder.style.display = 'flex';
        };
        if (img.complete && img.naturalWidth > 0) {
          img.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        }
      } else {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }
    });

    /* --- Build dots --- */
    var dots = [];
    slides.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'proj-carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function() { goTo(i); });
      dotsEl.appendChild(dot);
      dots.push(dot);
    });

    /* --- Navigation --- */
    function goTo(index) {
      current = (index + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function(d, i) {
        d.classList.toggle('active', i === current);
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

    /* --- Touch swipe --- */
    var touchStartX = 0;
    track.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    }, { passive: true });
  });
})();


/* ── ACTIVITY CAROUSELS ───────────────────── */
(function initActivityCarousels() {
  document.querySelectorAll('[data-act-carousel]').forEach(function(carousel) {
    var track   = carousel.querySelector('.act-carousel-track');
    var slides  = carousel.querySelectorAll('.act-carousel-slide');
    var prevBtn = carousel.querySelector('.act-carousel-prev');
    var nextBtn = carousel.querySelector('.act-carousel-next');
    var dotsEl  = carousel.querySelector('.act-carousel-dots');

    if (!track || slides.length === 0) return;

    var total   = slides.length;
    var current = 0;

    /* --- Show real images, hide placeholders --- */
    slides.forEach(function(slide) {
      var img         = slide.querySelector('.act-slide-img');
      var placeholder = slide.querySelector('.act-slide-placeholder');
      if (!img) return;

      var src = img.getAttribute('src');
      if (src && src !== '') {
        img.onload = function() {
          img.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        };
        img.onerror = function() {
          img.style.display = 'none';
          if (placeholder) placeholder.style.display = 'flex';
        };
        if (img.complete && img.naturalWidth > 0) {
          img.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        }
      } else {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }
    });

    /* --- Build dots --- */
    var dots = [];
    slides.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'act-carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function() { goTo(i); });
      dotsEl.appendChild(dot);
      dots.push(dot);
    });

    /* --- Navigation --- */
    function goTo(index) {
      current = (index + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function(d, i) {
        d.classList.toggle('active', i === current);
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

    /* --- Click image to open lightbox --- */
    slides.forEach(function(slide) {
      var img = slide.querySelector('.act-slide-img');
      if (img) {
        img.addEventListener('click', function() {
          if (img.style.display !== 'none' && img.src) {
            var lbEvent = new MouseEvent('click', { bubbles: true });
            img.classList.add('gallery-img');
            img.dispatchEvent(lbEvent);
            img.classList.remove('gallery-img');
          }
        });
      }
    });

    /* --- Touch swipe --- */
    var touchStartX = 0;
    track.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    }, { passive: true });
  });
})();