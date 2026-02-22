(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  // ----------------------------
  // Theme (dark/light)
  // ----------------------------
  const themeBtn = qs('[data-theme-toggle]');
  const getPreferredTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };
  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', t);
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  applyTheme(getPreferredTheme());
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    // View Transitions API if supported
    if (document.startViewTransition) {
      document.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  });


  // ----------------------------
  // Mobile nav (hamburger)
  // ----------------------------
  const burger = qs('[data-burger]') || qs('.menu-toggle');
  // v2 pages use .nav-links, project pages use #drawer.mobile-drawer
  const drawer = qs('[data-drawer]') || qs('#drawer') || qs('.mobile-drawer') || qs('.nav-links');
  const topHeader = qs('.top-navbar');
  const altHeader = qs('.header');

  const isTopNav = !!topHeader; // v2 pages
  const isOpen = () => {
    if (!burger) return false;
    return burger.getAttribute('aria-expanded') === 'true';
  };

  const openMenu = () => {
    if (!burger) return;
    if (isTopNav) {
      topHeader?.classList.add('menu-open');
    } else {
      // Project pages
      altHeader?.classList.add('menu-open');
      if (drawer) {
        drawer.hidden = false;
        drawer.classList.add('open');
      }
    }
    burger.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    if (isTopNav) {
      topHeader?.classList.remove('menu-open');
    } else {
      altHeader?.classList.remove('menu-open');
      if (drawer) {
        drawer.classList.remove('open');
        drawer.hidden = true;
      }
    }
    burger?.setAttribute('aria-expanded', 'false');
  };

  burger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) closeMenu();
    else openMenu();
  });

  // Close when clicking a link (mobile)
  qsa('.nav-links a, .mobile-drawer a, [data-drawer] a').forEach(a => a.addEventListener('click', closeMenu));

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!burger) return;
    if (!isOpen()) return;
    const t = e.target;
    const headerEl = topHeader || altHeader;
    const clickedInsideHeader = headerEl ? headerEl.contains(t) : false;
    const clickedInsideDrawer = drawer ? drawer.contains(t) : false;
    if (!clickedInsideHeader && !clickedInsideDrawer) closeMenu();
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Close automatically when resizing up to desktop/tablet
  window.addEventListener('resize', () => {
    const cutoff = isTopNav ? 768 : 980;
    if (window.innerWidth > cutoff) closeMenu();
  });

  // Small helper class for entrance animations
  requestAnimationFrame(() => document.documentElement.classList.add('page-ready'));

  // ----------------------------
  // Reveal on scroll
  // ----------------------------
  const revealEls = qsa('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  // ----------------------------
  // Animate progress bars once visible
  // ----------------------------
  const bars = qsa('[data-progress]');
  if (bars.length) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const pct = el.getAttribute('data-progress') || '0';
        const inner = qs('i', el);
        if (inner && !inner.dataset.done) {
          inner.dataset.done = '1';
          inner.style.width = pct + '%';
          inner.animate(
            [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
            { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
          );
        }
      });
    }, { threshold: 0.35 });
    bars.forEach(b => io2.observe(b));
  }

  // ----------------------------
  // View transitions for page navigation (same-origin)
  // ----------------------------
  if (document.startViewTransition) {
    qsa('a[data-vt]').forEach(link => {
      link.addEventListener('click', (e) => {
        const url = new URL(link.href);
        if (url.origin !== location.origin) return; // allow normal
        e.preventDefault();
        document.startViewTransition(() => {
          location.href = link.href;
        });
      });
    });
  }

  // ----------------------------
  // Contact form (no backend needed)
  // - validates
  // - opens mail client with pre-filled body (works offline)
  // - stores a copy in localStorage as backup
  // ----------------------------
  const form = qs('[data-contact-form]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = qs('#fullName')?.value.trim();
    const email = qs('#email')?.value.trim();
    const subject = qs('#subject')?.value.trim();
    const message = qs('#message')?.value.trim();

    const errors = [];
    if (!name) errors.push('Please enter your full name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
    if (!message || message.length < 10) errors.push('Message should be at least 10 characters.');

    const status = qs('[data-form-status]');
    const setStatus = (txt, type='info') => {
      if (!status) return;
      status.textContent = txt;
      status.style.color = type === 'error' ? 'var(--danger)' : 'var(--muted)';
    };

    if (errors.length) {
      setStatus(errors[0], 'error');
      return;
    }

    // Backup copy
    const existing = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    existing.unshift({ name, email, subject, message, at: new Date().toISOString() });
    localStorage.setItem('contactSubmissions', JSON.stringify(existing.slice(0, 20)));

    setStatus('Opening your email app… If it doesn\'t open, copy the message below and send it manually.');

    const to = form.getAttribute('data-to') || 'adriananunciacion80@gmail.com';
    const mailSubject = encodeURIComponent(subject || 'Portfolio Inquiry');
    const mailBody = encodeURIComponent(
      `Hi Adrian,%0D%0A%0D%0A${message}%0D%0A%0D%0A—%0D%0A${name}%0D%0A${email}`
    );

    // mailto is the only universally "functional" option without a server / keys.
    window.location.href = `mailto:${to}?subject=${mailSubject}&body=${mailBody}`;

    form.reset();
    setTimeout(() => setStatus('Message prepared. Thanks for reaching out!'), 900);
  });

})();
