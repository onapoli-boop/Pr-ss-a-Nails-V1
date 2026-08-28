// VELOUR mockup — GSAP + ScrollTrigger for animation (with a plain-JS
// fallback if the CDN scripts fail to load, e.g. no internet connection)

document.addEventListener('DOMContentLoaded', () => {

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // ------------------------------------------------------------------
  // Hero entrance — staggered fade-up (falls back to instantly visible)
  // ------------------------------------------------------------------
  if (hasGSAP) {
    gsap.to('.hero-copy > *', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.08,
      delay: 0.1,
    });
  } else {
    document.querySelectorAll('.hero-copy > *').forEach(el => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  // ------------------------------------------------------------------
  // Section reveals on scroll (falls back to instantly visible)
  // ------------------------------------------------------------------
  if (hasGSAP) {
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; });
  }

  // ------------------------------------------------------------------
  // 7 Days stat count-up (falls back to showing the final number directly)
  // ------------------------------------------------------------------
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (!hasGSAP) { el.textContent = target + suffix; return; }
    const counter = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(counter.val) + suffix; },
        });
      },
    });
  });

  // ------------------------------------------------------------------
  // Header shadow on scroll (falls back to a plain scroll listener)
  // ------------------------------------------------------------------
  const header = document.querySelector('.site-header');
  if (hasGSAP) {
    ScrollTrigger.create({
      start: 'top -12',
      end: 99999,
      toggleClass: { targets: header, className: 'is-scrolled' },
    });
  } else {
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    });
  }

  // ------------------------------------------------------------------
  // Look Builder — 7 Days quiz popup
  // ------------------------------------------------------------------
  const moods = {
    girlboss:  { label: 'Girlboss',  cls: 'ph' },
    cleangirl: { label: 'Clean Girl', cls: 'ph ph-rose' },
    afterwork: { label: 'Afterwork', cls: 'ph ph-bordeaux' },
    dark:      { label: 'After Dark', cls: 'ph ph-noir' },
  };
  const moodKeys = Object.keys(moods);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const builderOverlay = document.getElementById('builderOverlay');
  const lookBuilder = document.getElementById('lookBuilder');
  const builderCloseBtn = document.getElementById('builderCloseBtn');
  const openBuilderBtn = document.getElementById('openBuilderBtn');
  const builderStart = document.getElementById('builderStart');
  const builderDaysEl = document.getElementById('builderDays');
  const builderAdd = document.getElementById('builderAdd');

  let weekdayMood = null;
  let weekendMood = null;
  let assignment = [];

  function goToStep(step) {
    document.querySelectorAll('.builder-step').forEach(el => {
      el.hidden = el.dataset.step !== String(step);
    });
    document.querySelectorAll('.builder-progress .dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.dot === String(step));
    });
    const activeStep = document.querySelector(`.builder-step[data-step="${step}"]`);
    if (activeStep && hasGSAP) {
      gsap.fromTo(activeStep, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
    }
  }

  function openBuilder() {
    weekdayMood = null;
    weekendMood = null;
    lookBuilder.hidden = false;
    builderOverlay.classList.add('open');
    goToStep(0);
  }
  function closeBuilder() {
    lookBuilder.hidden = true;
    builderOverlay.classList.remove('open');
  }

  function renderDays() {
    // Mon–Thu and Sun take the weekday mood, Fri–Sat take the weekend mood
    assignment = [weekdayMood, weekdayMood, weekdayMood, weekdayMood, weekendMood, weekendMood, weekdayMood];
    builderDaysEl.innerHTML = '';
    assignment.forEach((moodKey, i) => {
      const day = document.createElement('div');
      day.className = 'builder-day';
      day.innerHTML = `
        <div class="${moods[moodKey].cls}"></div>
        <span class="bd-day">${dayNames[i]}</span>
        <span class="bd-mood">${moods[moodKey].label}</span>
      `;
      day.addEventListener('click', () => {
        const currentIndex = moodKeys.indexOf(assignment[i]);
        const nextMood = moodKeys[(currentIndex + 1) % moodKeys.length];
        assignment[i] = nextMood;
        day.querySelector('div').className = moods[nextMood].cls;
        day.querySelector('.bd-mood').textContent = moods[nextMood].label;
        if (hasGSAP) gsap.fromTo(day, { opacity: 0.4 }, { opacity: 1, duration: 0.3 });
      });
      builderDaysEl.appendChild(day);
    });
  }

  openBuilderBtn?.addEventListener('click', (e) => { e.preventDefault(); openBuilder(); });
  builderCloseBtn?.addEventListener('click', closeBuilder);
  builderOverlay?.addEventListener('click', closeBuilder);
  builderStart?.addEventListener('click', () => goToStep(1));

  document.querySelectorAll('.builder-step[data-step="1"] .builder-option').forEach(btn => {
    btn.addEventListener('click', () => { weekdayMood = btn.dataset.answer; goToStep(2); });
  });
  document.querySelectorAll('.builder-step[data-step="2"] .builder-option').forEach(btn => {
    btn.addEventListener('click', () => {
      weekendMood = btn.dataset.answer;
      renderDays();
      goToStep(3);
    });
  });
  builderAdd?.addEventListener('click', () => {
    closeBuilder();
    openCart();
  });

  // ------------------------------------------------------------------
  // Blog — category filters
  // ------------------------------------------------------------------
  const blogFilters = document.getElementById('blogFilters');
  const blogGrid = document.getElementById('blogGrid');
  const blogEmpty = document.getElementById('blogEmpty');
  if (blogFilters && blogGrid) {
    const cards = blogGrid.querySelectorAll('.blog-card');
    blogFilters.querySelectorAll('.pdp-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        blogFilters.querySelectorAll('.pdp-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        let visibleCount = 0;
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('filtered-out', !match);
          if (match) visibleCount++;
        });
        if (blogEmpty) blogEmpty.hidden = visibleCount > 0;
      });
    });
  }

  // ------------------------------------------------------------------
  // PDP — gallery thumbnails
  // ------------------------------------------------------------------
  const pdpMainImage = document.getElementById('pdpMainImage');
  document.querySelectorAll('.pdp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const img = thumb.dataset.img;
      if (img && pdpMainImage) {
        pdpMainImage.style.opacity = 0;
        setTimeout(() => {
          pdpMainImage.style.backgroundImage = `url('${img}')`;
          pdpMainImage.style.opacity = 1;
        }, 150);
      }
      document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // ------------------------------------------------------------------
  // PDP — shape chips (visual selection only in this mockup)
  // ------------------------------------------------------------------
  document.querySelectorAll('#shapeChips .pdp-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#shapeChips .pdp-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // ------------------------------------------------------------------
  // PDP — accordion
  // ------------------------------------------------------------------
  document.querySelectorAll('.accordion-item').forEach(item => {
    const head = item.querySelector('.accordion-head');
    head?.addEventListener('click', () => {
      const group = item.closest('.accordion');
      const isOpen = item.classList.contains('open');
      group.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-icon').textContent = '+';
      });
      if (!isOpen) {
        item.classList.add('open');
        item.querySelector('.accordion-icon').textContent = '−';
      }
    });
  });

  // ------------------------------------------------------------------
  // PDP — wishlist toggle (visual only)
  // ------------------------------------------------------------------
  const pdpWishBtn = document.getElementById('pdpWishBtn');
  pdpWishBtn?.addEventListener('click', () => {
    pdpWishBtn.classList.toggle('saved');
    pdpWishBtn.querySelector('svg').nextSibling.textContent =
      pdpWishBtn.classList.contains('saved') ? ' Enregistré' : ' Enregistrer';
  });

  // ------------------------------------------------------------------
  // PDP — add to bag (main + sticky mobile bar) opens the cart drawer
  // ------------------------------------------------------------------
  const pdpAddBtn = document.getElementById('pdpAddBtn');
  const stickyAddBtn = document.getElementById('stickyAddBtn');
  [pdpAddBtn, stickyAddBtn].forEach(btn => {
    btn?.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = 'Ajouté ✓';
      setTimeout(() => { btn.textContent = original; openCart(); }, 500);
    });
  });

  // ------------------------------------------------------------------
  // PDP — sticky mobile add-to-cart bar, shown once the main buybox
  // has scrolled out of view
  // ------------------------------------------------------------------
  const stickyBuyBar = document.getElementById('stickyBuyBar');
  const pdpBuybox = document.querySelector('.pdp-buybox');
  if (stickyBuyBar && pdpBuybox) {
    if (hasGSAP) {
      ScrollTrigger.create({
        trigger: pdpBuybox,
        start: 'bottom top',
        onEnter: () => stickyBuyBar.classList.add('visible'),
        onLeaveBack: () => stickyBuyBar.classList.remove('visible'),
      });
    } else {
      window.addEventListener('scroll', () => {
        const rect = pdpBuybox.getBoundingClientRect();
        stickyBuyBar.classList.toggle('visible', rect.bottom < 0);
      });
    }
  }

  // ------------------------------------------------------------------
  // Cart drawer
  // ------------------------------------------------------------------
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const openBtn = document.getElementById('cartOpenBtn');
  const closeBtn = document.getElementById('cartCloseBtn');

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }
  openBtn?.addEventListener('click', openCart);
  closeBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  // ------------------------------------------------------------------
  // Language selector (visual only in this mockup)
  // ------------------------------------------------------------------
  document.querySelectorAll('.lang-select button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-select button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ------------------------------------------------------------------
  // Quick add feedback (mockup only — no real cart logic)
  // ------------------------------------------------------------------
  document.querySelectorAll('.quick-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = 'Ajouté ✓';
      setTimeout(() => { btn.textContent = original; }, 1400);
    });
  });

  // ------------------------------------------------------------------
  // Before / after compare slider — native range drives the clip-path,
  // GSAP just adds a light touch-feedback pulse on the handle
  // ------------------------------------------------------------------
  const compareRange = document.getElementById('compareRange');
  const compareAfter = document.getElementById('compareAfter');
  const compareHandle = document.getElementById('compareHandle');

  if (compareRange) {
    if (hasGSAP) gsap.set(compareHandle, { xPercent: -50 });
    else compareHandle.style.transform = 'translateX(-50%)';

    function updateCompare(value) {
      compareAfter.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
      if (hasGSAP) {
        gsap.to(compareHandle, { left: `${value}%`, duration: 0.05, ease: 'none', overwrite: true });
      } else {
        compareHandle.style.left = `${value}%`;
      }
    }
    updateCompare(compareRange.value);
    compareRange.addEventListener('input', (e) => updateCompare(e.target.value));

    if (hasGSAP) {
      const pulse = (scale) => gsap.to(compareHandle, { scale, duration: 0.25, ease: 'power2.out' });
      compareRange.addEventListener('pointerdown', () => pulse(1.15));
      window.addEventListener('pointerup', () => pulse(1));
    }
  }

});
