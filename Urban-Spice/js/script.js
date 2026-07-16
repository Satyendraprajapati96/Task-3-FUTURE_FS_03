/* =========================================================================
   URBAN SPICE — script.js
   Vanilla ES6. No frameworks, no dependencies beyond the DOM.
   Talks to the backend via window.UrbanSpiceAPI (see js/api.js).
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const api = window.UrbanSpiceAPI; // may be undefined if api.js failed to load

  /* ---------------------------------------------------------------------
     0. Loading screen
     --------------------------------------------------------------------- */
  const loadingScreen = document.getElementById('loading-screen');
  window.addEventListener('load', () => {
    setTimeout(() => loadingScreen && loadingScreen.classList.add('hide'), 350);
  });
  setTimeout(() => loadingScreen && loadingScreen.classList.add('hide'), 3500);

  /* ---------------------------------------------------------------------
     1. Sticky navbar + scroll progress bar
     --------------------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const progressBar = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = pct + '%';
    if (navbar) navbar.classList.toggle('scrolled', scrollTop > 12);
    if (backToTop) backToTop.classList.toggle('show', scrollTop > 500);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------------------------------------------------------------
     2. Mobile menu
     --------------------------------------------------------------------- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIconOpen = document.getElementById('icon-open');
  const menuIconClose = document.getElementById('icon-close');

  menuToggle?.addEventListener('click', () => {
    mobileMenu.classList.toggle('flex');
    mobileMenu.classList.toggle('hidden');
    menuIconOpen.classList.toggle('hidden');
    menuIconClose.classList.toggle('hidden');
    menuToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('flex'));
  });

  document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      menuIconOpen.classList.remove('hidden');
      menuIconClose.classList.add('hidden');
    });
  });

  /* ---------------------------------------------------------------------
     3. Dark / light mode toggle (persisted)
     --------------------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const savedTheme = localStorage.getItem('urban-spice-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = (dark) => {
    root.classList.toggle('dark', dark);
    themeToggles.forEach(btn => btn.setAttribute('aria-pressed', dark));
  };
  applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

  themeToggles.forEach(btn => btn.addEventListener('click', () => {
    const isDark = root.classList.contains('dark');
    applyTheme(!isDark);
    localStorage.setItem('urban-spice-theme', !isDark ? 'dark' : 'light');
  }));

  /* ---------------------------------------------------------------------
     4. Scroll reveal (IntersectionObserver — lightweight AOS replacement)
     Exposed as observeReveal() so dynamically-injected content (menu,
     gallery, testimonials loaded from the API) can opt in too.
     --------------------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-reveal-delay') || 0;
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  const observeReveal = (root = document) => {
    root.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
  };
  observeReveal();

  /* ---------------------------------------------------------------------
     5. Animated counters
     --------------------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(step);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  /* ---------------------------------------------------------------------
     6. Menu category filter
     Re-queries cards at click time so it keeps working after the grid
     is repopulated from the API.
     --------------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.menu-filter-btn');
  let activeMenuFilter = 'all';

  const applyMenuFilter = () => {
    document.querySelectorAll('#menu-grid [data-category]').forEach(card => {
      const match = activeMenuFilter === 'all' || card.getAttribute('data-category') === activeMenuFilter;
      card.style.display = match ? '' : 'none';
      if (match) {
        card.style.animation = 'none';
        requestAnimationFrame(() => { card.style.animation = 'fadeInCard .5s ease'; });
      }
    });
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMenuFilter = btn.getAttribute('data-filter');
      applyMenuFilter();
    });
  });

  const styleTag = document.createElement('style');
  styleTag.textContent = '@keyframes fadeInCard{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(styleTag);

  /* ---------------------------------------------------------------------
     7. Gallery lightbox
     Uses event delegation on #gallery-grid so it keeps working after the
     grid is repopulated from the API — no need to re-bind per item.
     --------------------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const galleryGrid = document.getElementById('gallery-grid');

  galleryGrid?.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const img = item.querySelector('img');
    lightboxImg.src = img.src.replace(/w=\d+/, 'w=1400');
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------------------------------------------------------------------
     8. Testimonial slider
     Wrapped in initTestimonialSlider() so it can be rebuilt after the
     track is repopulated with testimonials fetched from the API.
     --------------------------------------------------------------------- */
  const track = document.getElementById('testimonial-track');
  const dotsWrap = document.getElementById('testimonial-dots');
  let testiInterval;

  const initTestimonialSlider = () => {
    if (!track) return;
    clearInterval(testiInterval);
    dotsWrap.innerHTML = '';
    const slides = Array.from(track.children);
    if (!slides.length) return;

    let currentSlide = 0;
    const goToSlide = (i) => {
      currentSlide = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dotsWrap.querySelectorAll('.testi-dot').forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
    };

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => { goToSlide(i); resetAutoplay(); });
      dotsWrap.appendChild(dot);
    });

    const startAutoplay = () => { testiInterval = setInterval(() => goToSlide(currentSlide + 1), 5500); };
    const resetAutoplay = () => { clearInterval(testiInterval); startAutoplay(); };
    startAutoplay();

    const prevBtn = document.getElementById('testi-prev');
    const nextBtn = document.getElementById('testi-next');
    prevBtn?.replaceWith(prevBtn.cloneNode(true)); // strip old listeners before re-binding
    nextBtn?.replaceWith(nextBtn.cloneNode(true));
    document.getElementById('testi-prev')?.addEventListener('click', () => { goToSlide(currentSlide - 1); resetAutoplay(); });
    document.getElementById('testi-next')?.addEventListener('click', () => { goToSlide(currentSlide + 1); resetAutoplay(); });
  };
  initTestimonialSlider();

  /* ---------------------------------------------------------------------
     Shared form helpers (used by both the reservation and contact forms)
     --------------------------------------------------------------------- */
  const toast = document.getElementById('toast');
  const showToast = (message) => {
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  };

  const showFieldError = (input, message) => {
    if (!input) return;
    const errorEl = document.getElementById(input.id + '-error');
    input.classList.toggle('field-error', !!message);
    if (errorEl) errorEl.textContent = message || '';
  };

  const clearFormErrors = (formEl) => {
    formEl.querySelectorAll('.field').forEach(input => showFieldError(input, ''));
  };

  /**
   * Maps backend validation errors ({ field, message }[]) onto form inputs.
   * `fieldMap` translates a backend field name to a DOM input id when they
   * differ (e.g. backend "customerName" -> input id "res-name").
   */
  const applyServerErrors = (formEl, errors, fieldMap = {}) => {
    errors.forEach(({ field, message }) => {
      const inputId = fieldMap[field] || field;
      const input = document.getElementById(inputId) || formEl.querySelector(`[name="${field}"]`);
      showFieldError(input, message);
    });
  };

  /* ---------------------------------------------------------------------
     9. Reservation form — validates client-side, then submits to
        POST /api/reservations via the backend.
     --------------------------------------------------------------------- */
  const reservationForm = document.getElementById('reservation-form');

  const reservationValidators = {
    name: (v) => v.trim().length >= 2 ? '' : 'Please enter your full name.',
    phone: (v) => /^[0-9+()\-\s]{7,16}$/.test(v.trim()) ? '' : 'Enter a valid phone number.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    date: (v) => {
      if (!v) return 'Please choose a date.';
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return new Date(v) >= today ? '' : 'Date cannot be in the past.';
    },
    time: (v) => v ? '' : 'Please choose a time.',
    guests: (v) => (v >= 1 && v <= 12) ? '' : 'Guests must be between 1 and 12.',
  };

  reservationForm?.querySelectorAll('.field').forEach(input => {
    input.addEventListener('blur', () => {
      const rule = reservationValidators[input.name];
      if (rule) showFieldError(input, rule(input.value));
    });
  });

  reservationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    reservationForm.querySelectorAll('.field').forEach(input => {
      const rule = reservationValidators[input.name];
      if (rule) {
        const message = rule(input.value);
        showFieldError(input, message);
        if (message) valid = false;
      }
    });

    if (!valid) {
      reservationForm.querySelector('.field-error')?.closest('.field-wrap')?.querySelector('.field')?.focus();
      return;
    }

    const submitBtn = reservationForm.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    const payload = {
      customerName: reservationForm.name.value.trim(),
      email: reservationForm.email.value.trim(),
      phone: reservationForm.phone.value.trim(),
      date: reservationForm.date.value,
      time: reservationForm.time.value,
      guests: Number(reservationForm.guests.value),
      specialRequest: reservationForm.specialRequest ? reservationForm.specialRequest.value.trim() : '',
    };

    const fieldMap = {
      customerName: 'res-name', email: 'res-email', phone: 'res-phone',
      date: 'res-date', time: 'res-time', guests: 'res-guests', specialRequest: 'res-special-request',
    };

    try {
      if (!api) throw new Error('The booking service is not available right now.');
      const result = await api.post('/reservations', payload);
      reservationForm.reset();
      clearFormErrors(reservationForm);
      showToast(result?.message || "Reservation request sent — we'll confirm by phone shortly.");
    } catch (err) {
      if (err.errors && err.errors.length) {
        applyServerErrors(reservationForm, err.errors, fieldMap);
      }
      showToast(err.message || 'Something went wrong — please try again.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  /* ---------------------------------------------------------------------
     9b. Contact form — validates client-side, then submits to
         POST /api/contact via the backend.
     --------------------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');

  const contactValidators = {
    name: (v) => v.trim().length >= 2 ? '' : 'Please enter your full name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    phone: (v) => !v.trim() || /^[0-9+()\-\s]{7,16}$/.test(v.trim()) ? '' : 'Enter a valid phone number.',
    message: (v) => v.trim().length >= 5 ? '' : 'Please enter a message (at least 5 characters).',
  };

  contactForm?.querySelectorAll('.field').forEach(input => {
    input.addEventListener('blur', () => {
      const rule = contactValidators[input.name];
      if (rule) showFieldError(input, rule(input.value));
    });
  });

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    contactForm.querySelectorAll('.field').forEach(input => {
      const rule = contactValidators[input.name];
      if (rule) {
        const message = rule(input.value);
        showFieldError(input, message);
        if (message) valid = false;
      }
    });

    if (!valid) {
      contactForm.querySelector('.field-error')?.closest('.field-wrap')?.querySelector('.field')?.focus();
      return;
    }

    const submitBtn = contactForm.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    const payload = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      phone: contactForm.phone.value.trim(),
      message: contactForm.message.value.trim(),
    };

    try {
      if (!api) throw new Error('The messaging service is not available right now.');
      const result = await api.post('/contact', payload);
      contactForm.reset();
      clearFormErrors(contactForm);
      showToast(result?.message || "Message sent — we'll get back to you soon.");
    } catch (err) {
      if (err.errors && err.errors.length) {
        applyServerErrors(contactForm, err.errors, { name: 'contact-name', email: 'contact-email', phone: 'contact-phone', message: 'contact-message' });
      }
      showToast(err.message || 'Something went wrong — please try again.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  /* ---------------------------------------------------------------------
     10. Newsletter form (footer) — cosmetic only, no backend endpoint
     --------------------------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletter-form');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
      emailInput.classList.add('field-error');
      return;
    }
    emailInput.classList.remove('field-error');
    emailInput.value = '';
    showToast('You\'re subscribed! Watch your inbox for chef\'s specials.');
  });

  /* ---------------------------------------------------------------------
     11. Custom cursor (desktop only)
     --------------------------------------------------------------------- */
  const isDesktop = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (isDesktop) {
    document.body.classList.add('has-custom-cursor');
    const dot = document.createElement('div'); dot.id = 'cursor-dot';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.append(dot, ring);

    let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px';
    });
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    };
    animateRing();

    // Delegated so it also picks up cards/images injected later from the API
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, input, textarea, .gallery-item')) ring.classList.add('hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, input, textarea, .gallery-item')) ring.classList.remove('hovering');
    });
  }

  /* ---------------------------------------------------------------------
     12. Hero spice-dust particles (generated once)
     --------------------------------------------------------------------- */
  const particleField = document.getElementById('particle-field');
  if (particleField) {
    const count = window.innerWidth < 640 ? 14 : 28;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'spice-particle';
      const size = Math.random() * 3 + 1.5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = '-10px';
      p.style.animationDuration = (Math.random() * 10 + 10) + 's';
      p.style.animationDelay = (Math.random() * 12) + 's';
      particleField.appendChild(p);
    }
  }

  /* ---------------------------------------------------------------------
     13. Set current year in footer
     --------------------------------------------------------------------- */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     14. Dynamic content from the backend — menu, gallery, testimonials.
     Each loader fails silently (console only) and leaves the existing
     static markup in place if the API is unreachable or returns nothing,
     so the site still looks complete with the backend offline.
     --------------------------------------------------------------------- */
  const BADGE_LABEL = { spicy: 'Spicy', chef: "Chef's Pick", veg: 'Vegan' };
  const BADGE_CLASS = { spicy: 'badge-spicy', chef: 'badge-chef', veg: 'badge-veg' };
  const CATEGORY_LABEL = { starters: 'Starter', mains: 'Main', desserts: 'Dessert', drinks: 'Drink' };
  const FALLBACK_DISH_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80';
  const FALLBACK_GALLERY_IMAGE = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=700&q=80';

  const escapeHTML = (str = '') => str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const renderMenuCard = (item) => {
    const badgeHTML = item.badge && item.badge !== 'none'
      ? `<span class="badge ${BADGE_CLASS[item.badge]} absolute top-3 left-3">${BADGE_LABEL[item.badge]}</span>`
      : '';
    const imgSrc = item.image ? api.resolveImage(item.image) : FALLBACK_DISH_IMAGE;
    return `
      <article class="ticket-card" data-category="${escapeHTML(item.category)}" data-reveal="scale">
        <div class="ticket-img-wrap relative overflow-hidden">
          <img src="${imgSrc}" alt="${escapeHTML(item.name)}" loading="lazy">
          ${badgeHTML}
        </div>
        <div class="p-6 flex-1 flex flex-col">
          <h3 class="font-display text-xl mb-2">${escapeHTML(item.name)}</h3>
          <p class="text-sm mb-4 flex-1" style="color:var(--text-muted)">${escapeHTML(item.description)}</p>
          <div class="ticket-line"><span class="text-sm font-medium">${CATEGORY_LABEL[item.category] || 'Dish'}</span><span class="ticket-dots"></span><span class="ticket-price">$${Number(item.price).toFixed(0)}</span></div>
        </div>
      </article>`;
  };

  const loadMenuFromAPI = async () => {
    const grid = document.getElementById('menu-grid');
    if (!api || !grid) return;
    try {
      const res = await api.get('/menu');
      const items = res?.data?.items || [];
      if (!items.length) return; // keep static fallback cards
      grid.innerHTML = items.map(renderMenuCard).join('');
      observeReveal(grid);
      applyMenuFilter();
    } catch (err) {
      console.warn('Menu API unavailable — showing static fallback menu.', err.message);
    }
  };

  const renderGalleryItem = (image) => {
    const imgSrc = image.image ? api.resolveImage(image.image) : FALLBACK_GALLERY_IMAGE;
    return `
      <div class="gallery-item relative overflow-hidden" data-reveal="scale">
        <img src="${imgSrc}" alt="${escapeHTML(image.title)}" loading="lazy">
        <div class="gallery-overlay"><span class="text-white text-sm font-medium">${escapeHTML(image.title)}</span></div>
      </div>`;
  };

  const loadGalleryFromAPI = async () => {
    const grid = document.getElementById('gallery-grid');
    if (!api || !grid) return;
    try {
      const res = await api.get('/gallery');
      const images = res?.data?.images || [];
      if (!images.length) return; // keep static fallback gallery
      grid.innerHTML = images.map(renderGalleryItem).join('');
      observeReveal(grid);
    } catch (err) {
      console.warn('Gallery API unavailable — showing static fallback gallery.', err.message);
    }
  };

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.round(rating);
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>`;
  }).join('');

  const renderTestimonialSlide = (t) => `
    <div class="testimonial-slide px-2">
      <div class="glass rounded-3xl p-8 md:p-12 text-center">
        <div class="flex justify-center gap-1 text-gold mb-5" aria-label="${t.rating} out of 5 stars">${renderStars(t.rating)}</div>
        <p class="font-display text-xl md:text-2xl leading-relaxed italic text-white/90 mb-7">"${escapeHTML(t.review)}"</p>
        ${t.image ? `<img src="${api.resolveImage(t.image)}" alt="Portrait of ${escapeHTML(t.customerName)}" loading="lazy" class="w-14 h-14 rounded-full object-cover mx-auto mb-3 border-2 border-gold">` : ''}
        <p class="font-medium">${escapeHTML(t.customerName)}</p>
        ${t.profession ? `<p class="text-xs text-white/50 font-mono uppercase tracking-wider">${escapeHTML(t.profession)}</p>` : ''}
      </div>
    </div>`;

  const loadTestimonialsFromAPI = async () => {
    if (!api || !track) return;
    try {
      const res = await api.get('/testimonials');
      const testimonials = res?.data?.testimonials || [];
      if (!testimonials.length) return; // keep static fallback testimonials
      track.innerHTML = testimonials.map(renderTestimonialSlide).join('');
      initTestimonialSlider();
    } catch (err) {
      console.warn('Testimonials API unavailable — showing static fallback testimonials.', err.message);
    }
  };

  loadMenuFromAPI();
  loadGalleryFromAPI();
  loadTestimonialsFromAPI();

});
