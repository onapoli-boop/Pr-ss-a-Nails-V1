// VELOUR theme — GSAP + ScrollTrigger for animation (with a plain-JS
// fallback if the CDN scripts fail to load, e.g. no internet connection).
// Ported from the static mockup's script.js — same interaction patterns,
// with the cart drawer and add-to-cart controls now wired to Shopify's
// real AJAX Cart API instead of static markup.

document.addEventListener('DOMContentLoaded', () => {

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // ------------------------------------------------------------------
  // Hero entrance — staggered fade-up (falls back to instantly visible)
  // ------------------------------------------------------------------
  if (hasGSAP) {
    gsap.fromTo('.hero-copy > *',
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        delay: 0.1,
      }
    );
  }

  // ------------------------------------------------------------------
  // Section reveals on scroll (falls back to instantly visible)
  // ------------------------------------------------------------------
  function initReveals(scope = document) {
    if (hasGSAP) {
      gsap.utils.toArray(scope.querySelectorAll('.reveal')).forEach((el) => {
        if (el.dataset.revealed) return;
        el.dataset.revealed = 'true';
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
      scope.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; });
    }
  }
  initReveals();

  // ------------------------------------------------------------------
  // Safety net: gsap.fromTo() with a scrollTrigger renders its hidden
  // "from" state as soon as it runs, before the trigger condition is
  // ever checked. If ScrollTrigger never actually fires — GSAP fails to
  // load, or a sandboxed context like the theme editor's preview iframe
  // doesn't dispatch scroll/resize the way a real tab does — content
  // would stay invisible forever. Force-show anything still hidden after
  // a short delay so a broken trigger can never permanently hide content.
  // ------------------------------------------------------------------
  setTimeout(() => {
    document.querySelectorAll('.reveal, .hero-copy > *').forEach(el => {
      if (getComputedStyle(el).opacity === '0') {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
  }, 1200);

  // ------------------------------------------------------------------
  // Mobile nav (burger) — below 860px nav.main-nav is an off-canvas
  // panel toggled with the .is-open class; see assets/theme.css.
  // ------------------------------------------------------------------
  const burgerBtn = document.getElementById('burgerBtn');
  const mainNav = document.querySelector('nav.main-nav');
  if (burgerBtn && mainNav) {
    const closeNav = () => {
      burgerBtn.classList.remove('is-open');
      mainNav.classList.remove('is-open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };
    const toggleNav = () => {
      const isOpen = mainNav.classList.toggle('is-open');
      burgerBtn.classList.toggle('is-open', isOpen);
      burgerBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-open', isOpen);
    };
    burgerBtn.setAttribute('role', 'button');
    burgerBtn.setAttribute('tabindex', '0');
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.setAttribute('aria-controls', 'MainNav');
    burgerBtn.addEventListener('click', toggleNav);
    burgerBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNav(); }
    });
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 860) closeNav(); });
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
  if (header) {
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
  }

  // ------------------------------------------------------------------
  // Look Builder — 7 Days quiz popup
  // Mood → variant mapping and cart line items come from the section's
  // data-* attributes (see sections/seven-days.liquid), populated in the
  // admin instead of hardcoded, so this stays product-agnostic.
  // ------------------------------------------------------------------
  const builderOverlay = document.getElementById('builderOverlay');
  const lookBuilder = document.getElementById('lookBuilder');
  const builderCloseBtn = document.getElementById('builderCloseBtn');
  const openBuilderBtn = document.getElementById('openBuilderBtn');
  const builderStart = document.getElementById('builderStart');
  const builderDaysEl = document.getElementById('builderDays');
  const builderAdd = document.getElementById('builderAdd');

  let moods = {};
  if (lookBuilder && lookBuilder.dataset.moods) {
    try { moods = JSON.parse(lookBuilder.dataset.moods); } catch (e) { moods = {}; }
  }
  let dayTags = [];
  if (lookBuilder && lookBuilder.dataset.dayTags) {
    try { dayTags = JSON.parse(lookBuilder.dataset.dayTags); } catch (e) { dayTags = []; }
  }
  const moodKeys = Object.keys(moods);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Among a product's variants, prefer one matching the customer's chosen
  // size (from step 1) that's also in stock; fall back to any variant with
  // that size, then to the first available variant, then to the first one.
  function pickVariant(variants, size) {
    if (!variants || !variants.length) return null;
    if (size) {
      const availableMatch = variants.find(v => v.available && v.options.includes(size));
      if (availableMatch) return availableMatch.id;
      const anyMatch = variants.find(v => v.options.includes(size));
      if (anyMatch) return anyMatch.id;
    }
    const firstAvailable = variants.find(v => v.available);
    return (firstAvailable || variants[0]).id;
  }

  // Prefer the product tagged for this exact day within the mood's own
  // collection (set in the "Option du quiz" block); fall back to the
  // mood's single manually-picked product if no tagged match exists yet.
  function dayProduct(moodKey, dayIndex) {
    const mood = moods[moodKey];
    if (!mood) return null;
    const tag = dayTags[dayIndex];
    const tagged = tag && mood.days && mood.days[tag];
    if (tagged && tagged.variants && tagged.variants.length) return tagged;
    return { image: mood.image, variants: mood.variants };
  }

  function variantForDay(moodKey, dayIndex, size) {
    const product = dayProduct(moodKey, dayIndex);
    return product ? pickVariant(product.variants, size) : null;
  }

  function imageForDay(moodKey, dayIndex) {
    const product = dayProduct(moodKey, dayIndex);
    return product && product.image ? product.image : null;
  }

  let selectedSize = null;
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
    selectedSize = null;
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

  // Renders either the real product photo for this day (once one is
  // resolved via variantForDay/imageForDay) or, failing that, the same
  // color-gradient placeholder used elsewhere in the theme. Uses a real
  // <img src> rather than an inline background-image style: stores with a
  // strict style-src CSP (no 'unsafe-inline') silently block inline style
  // attributes, which was hiding the photo entirely.
  function phMarkup(moodKey, i) {
    const mood = moods[moodKey];
    const image = imageForDay(moodKey, i);
    if (image) {
      return `<div class="ph ph-photo"><img src="${image}" alt="${mood.label}" loading="lazy"></div>`;
    }
    return `<div class="ph ${mood.modifier ? 'ph-' + mood.modifier : ''}"></div>`;
  }

  function renderDays() {
    if (!moodKeys.length) return;
    // Mon–Thu and Sun take the weekday mood, Fri–Sat take the weekend mood
    assignment = [weekdayMood, weekdayMood, weekdayMood, weekdayMood, weekendMood, weekendMood, weekdayMood];
    builderDaysEl.innerHTML = '';
    assignment.forEach((moodKey, i) => {
      const day = document.createElement('div');
      day.className = 'builder-day';
      const mood = moods[moodKey];
      day.innerHTML = `
        ${phMarkup(moodKey, i)}
        <span class="bd-day">${dayNames[i]}</span>
        <span class="bd-mood">${mood.label}</span>
      `;
      day.addEventListener('click', () => {
        const currentIndex = moodKeys.indexOf(assignment[i]);
        const nextMood = moodKeys[(currentIndex + 1) % moodKeys.length];
        assignment[i] = nextMood;
        day.querySelector('.ph').outerHTML = phMarkup(nextMood, i);
        day.querySelector('.bd-mood').textContent = moods[nextMood].label;
        if (hasGSAP) gsap.fromTo(day.querySelector('.ph'), { opacity: 0.4 }, { opacity: 1, duration: 0.3 });
      });
      builderDaysEl.appendChild(day);
    });
  }

  openBuilderBtn?.addEventListener('click', (e) => { e.preventDefault(); openBuilder(); });
  builderCloseBtn?.addEventListener('click', closeBuilder);
  builderOverlay?.addEventListener('click', closeBuilder);
  builderStart?.addEventListener('click', () => goToStep(1));

  document.querySelectorAll('.builder-step[data-step="1"] .builder-option').forEach(btn => {
    btn.addEventListener('click', () => { selectedSize = btn.dataset.answer; goToStep(2); });
  });
  document.querySelectorAll('.builder-step[data-step="2"] .builder-option').forEach(btn => {
    btn.addEventListener('click', () => { weekdayMood = btn.dataset.answer; goToStep(3); });
  });
  document.querySelectorAll('.builder-step[data-step="3"] .builder-option').forEach(btn => {
    btn.addEventListener('click', () => {
      weekendMood = btn.dataset.answer;
      renderDays();
      goToStep(4);
    });
  });
  builderAdd?.addEventListener('click', async () => {
    if (!assignment.length) { closeBuilder(); return; }
    const items = assignment
      .map((moodKey, i) => variantForDay(moodKey, i, selectedSize))
      .filter(Boolean)
      .map(id => ({ id, quantity: 1 }));
    if (items.length) {
      await addMultipleToCart(items);
    }
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
  // Accordion (product info + FAQ, independent instances)
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
  // PDP — gallery thumbnails
  // ------------------------------------------------------------------
  const pdpMainImage = document.querySelector('.js-pdp-main-image');
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
  // PDP — variant picker (generic: works for any number of options,
  // not just the mockup's single "Forme" option). Reads every variant
  // from the JSON Shopify embeds in #ProductVariantsData, matches the
  // currently selected option pills against variant.options, and
  // updates price / add-to-cart button / sticky bar accordingly.
  // ------------------------------------------------------------------
  const variantsDataEl = document.getElementById('ProductVariantsData');
  if (variantsDataEl) {
    const variants = JSON.parse(variantsDataEl.textContent);
    const optionGroups = document.querySelectorAll('#ProductVariants .pdp-chips');
    const selected = Array.from(optionGroups).map(group => {
      const active = group.querySelector('.pdp-chip.active');
      return active ? active.dataset.value : null;
    });

    function findMatchingVariant() {
      return variants.find(v => v.options.every((opt, i) => opt === selected[i]));
    }

    function formatMoney(cents) {
      return (cents / 100).toLocaleString(document.documentElement.lang || 'fr-FR', {
        style: 'currency',
        currency: window.theme?.currency || 'EUR',
      });
    }

    function updateForVariant(variant) {
      if (!variant) return;
      document.querySelectorAll('[data-pdp-price]').forEach(el => { el.innerHTML = formatMoney(variant.price); });
      document.querySelectorAll('[data-pdp-add-price]').forEach(el => { el.textContent = formatMoney(variant.price); });
      document.querySelectorAll('[data-pdp-sticky-price]').forEach(el => { el.textContent = formatMoney(variant.price); });
      document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
        btn.dataset.variantId = variant.id;
        btn.disabled = !variant.available;
      });
      if (variant.featured_image && pdpMainImage) {
        pdpMainImage.style.backgroundImage = `url('${variant.featured_image.src}')`;
      }
    }

    optionGroups.forEach((group, index) => {
      group.querySelectorAll('.pdp-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          group.querySelectorAll('.pdp-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          selected[index] = chip.dataset.value;
          updateForVariant(findMatchingVariant());
        });
      });
    });
  }

  // ------------------------------------------------------------------
  // PDP — wishlist toggle (visual only, matches the mockup)
  // ------------------------------------------------------------------
  const pdpWishBtn = document.getElementById('pdpWishBtn');
  pdpWishBtn?.addEventListener('click', () => {
    pdpWishBtn.classList.toggle('saved');
    const label = pdpWishBtn.querySelector('[data-wish-label]');
    if (label) {
      label.textContent = pdpWishBtn.classList.contains('saved')
        ? (window.theme?.strings?.wishlistAdded || 'Enregistré')
        : (window.theme?.strings?.wishlistAdd || 'Enregistrer');
    }
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
  // Quick add feedback + real add-to-cart (bestsellers / product grids)
  // ------------------------------------------------------------------
  document.querySelectorAll('.quick-add[data-variant-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const variantId = btn.dataset.variantId;
      if (!variantId) return;
      const original = btn.textContent;
      btn.textContent = window.theme?.strings?.adding || '...';
      const ok = await addToCart(variantId, 1);
      btn.textContent = ok ? (window.theme?.strings?.added || 'Ajouté ✓') : original;
      if (ok) openCart();
      setTimeout(() => { btn.textContent = original; }, 1400);
    });
  });

  // ------------------------------------------------------------------
  // Language selector (visual only for now, same as the mockup — real
  // locale switching comes once DE/ES/EN translations exist)
  // ------------------------------------------------------------------
  document.querySelectorAll('.lang-select button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-select button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ------------------------------------------------------------------
  // Before / after compare slider — native range drives the clip-path,
  // GSAP just adds a light touch-feedback pulse on the handle
  // ------------------------------------------------------------------
  document.querySelectorAll('.compare-slider').forEach(slider => {
    const compareRange = slider.querySelector('.compare-range');
    const compareAfter = slider.querySelector('.compare-after');
    const compareHandle = slider.querySelector('.compare-handle');
    if (!compareRange) return;

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
  });

  // ==================================================================
  // Shopify AJAX Cart
  // ==================================================================
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const openBtn = document.getElementById('cartOpenBtn');
  const closeBtn = document.getElementById('cartCloseBtn');
  const cartBody = document.getElementById('cartDrawerBody');
  const cartCountEls = document.querySelectorAll('.cart-count');
  const cartSubtotalEls = document.querySelectorAll('[data-cart-subtotal]');
  const cartGiftNoteEls = document.querySelectorAll('[data-cart-gift-note]');
  const cartEmptyTpl = document.getElementById('cartEmptyTemplate');

  function money(cents) {
    return (cents / 100).toLocaleString(document.documentElement.lang || 'fr-FR', {
      style: 'currency',
      currency: window.theme?.currency || 'EUR',
    });
  }

  function openCart() {
    cartDrawer?.classList.add('open');
    cartOverlay?.classList.add('open');
  }
  function closeCart() {
    cartDrawer?.classList.remove('open');
    cartOverlay?.classList.remove('open');
  }
  openBtn?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
  closeBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  // ------------------------------------------------------------------
  // 7 Days kit progress — counts cart line items whose variant belongs
  // to the merchant-configured "7 Days" collection (window.theme.sevenDaysKit
  // .variantIds, output server-side in layout/theme.liquid). The 40€
  // price itself is applied by a Shopify automatic discount once the
  // target quantity is reached — this only reflects/displays that state.
  // ------------------------------------------------------------------
  const kitBadge = document.querySelector('[data-kit-progress]');
  function updateKitProgress(cart) {
    const kit = window.theme?.sevenDaysKit;
    if (!kit || !kit.variantIds || !kit.variantIds.length) return;
    const count = cart.items
      .filter(item => kit.variantIds.includes(item.variant_id))
      .reduce((sum, item) => sum + item.quantity, 0);

    if (kitBadge) {
      if (count > 0) {
        kitBadge.hidden = false;
        kitBadge.classList.toggle('is-complete', count >= kit.target);
        const label = count >= kit.target
          ? (window.theme.strings.kitComplete || '').replace('%price%', kit.price || '')
          : (window.theme.strings.kitProgress || '').replace('%count%', count).replace('%target%', kit.target);
        kitBadge.textContent = label;
      } else {
        kitBadge.hidden = true;
      }
    }

    document.querySelectorAll('[data-add-to-kit]').forEach(btn => {
      const variantId = parseInt(btn.dataset.variantId, 10);
      const inKit = cart.items.some(item => item.variant_id === variantId);
      btn.classList.toggle('is-in-kit', inKit);
      btn.textContent = inKit ? (window.theme.strings.kitInKit || btn.textContent) : (window.theme.strings.kitAdd || btn.textContent);
    });
  }

  document.querySelectorAll('[data-add-to-kit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const variantId = btn.dataset.variantId;
      if (!variantId) return;
      await addToCart(variantId, 1);
      openCart();
    });
  });

  function renderCart(cart) {
    updateKitProgress(cart);
    cartCountEls.forEach(el => { el.textContent = cart.item_count; });
    cartSubtotalEls.forEach(el => { el.textContent = money(cart.total_price); });

    const threshold = parseInt(window.theme?.freeGiftThreshold || 0, 10) * 100;
    cartGiftNoteEls.forEach(el => {
      if (!threshold) { el.hidden = true; return; }
      const remaining = threshold - cart.total_price;
      if (remaining > 0) {
        el.hidden = false;
        el.textContent = (window.theme?.strings?.giftNote || '').replace('%amount%', money(remaining));
      } else {
        el.hidden = false;
        el.textContent = window.theme?.strings?.giftUnlocked || '';
      }
    });

    if (!cartBody) return;
    if (!cart.items.length) {
      cartBody.innerHTML = cartEmptyTpl ? cartEmptyTpl.innerHTML : '';
      return;
    }
    cartBody.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="ph ph-photo" style="background-image:url('${item.image || ''}');"></div>
        <div class="ci-info">
          <div class="name">${item.product_title}</div>
          <div class="coll">${item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : ''}</div>
          <div class="price">${money(item.final_line_price)}</div>
          <div class="ci-qty">
            <button type="button" class="ci-qty-btn" data-action="decrease" data-key="${item.key}" data-qty="${item.quantity - 1}" aria-label="${window.theme?.strings?.decrease || '-'}">−</button>
            <span>${item.quantity}</span>
            <button type="button" class="ci-qty-btn" data-action="increase" data-key="${item.key}" data-qty="${item.quantity + 1}" aria-label="${window.theme?.strings?.increase || '+'}">+</button>
          </div>
        </div>
        <button type="button" class="cart-item-remove" data-key="${item.key}" data-qty="0" aria-label="${window.theme?.strings?.remove || 'Retirer'}">✕</button>
      </div>
    `).join('');
  }

  async function fetchCart() {
    const res = await fetch('/cart.js');
    return res.json();
  }

  async function addToCart(variantId, quantity = 1) {
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: variantId, quantity }),
      });
      if (!res.ok) return false;
      const cart = await fetchCart();
      renderCart(cart);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function addMultipleToCart(items) {
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) return false;
      const cart = await fetchCart();
      renderCart(cart);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function changeLineQuantity(key, quantity) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });
      if (!res.ok) return;
      const cart = await res.json();
      renderCart(cart);
    } catch (e) { /* no-op */ }
  }

  cartBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (!btn) return;
    const key = btn.dataset.key;
    const qty = parseInt(btn.dataset.qty, 10);
    changeLineQuantity(key, qty);
  });

  // PDP add-to-cart (main buybox + sticky mobile bar) — populated once
  // sections/main-product.liquid ships; both buttons carry data-variant-id.
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const variantId = btn.dataset.variantId;
      if (!variantId) return;
      const original = btn.textContent;
      btn.textContent = window.theme?.strings?.adding || '...';
      const ok = await addToCart(variantId, 1);
      btn.textContent = original;
      if (ok) openCart();
    });
  });

  // Initial render from the cart Shopify already knows about, so totals
  // are correct even before any AJAX call happens on this page load.
  fetchCart().then(renderCart).catch(() => {});

  // Expose for other sections (e.g. a future main-product.liquid) that
  // load after this file and need to trigger the same cart flow.
  window.theme = window.theme || {};
  window.theme.cart = { addToCart, addMultipleToCart, openCart, closeCart, fetchCart, renderCart };
  window.theme.initReveals = initReveals;

});
