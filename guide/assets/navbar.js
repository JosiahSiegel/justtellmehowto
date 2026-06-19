/*!
 * justtellmehowto — shared navbar
 * Auto-injects a top navbar that matches each page's design tokens
 * (--parchment, --ink, --green, --rust, --ink-soft on :root).
 *
 * How to wire (one line, at the end of <body>):
 *   <script src="assets/navbar.js" defer></script>
 *
 * Link source priority:
 *   1) Fetch assets/navbar-manifest.json from the page's directory
 *   2) Fall back to a built-in default if the manifest is missing/blocked
 *      (e.g. when the page is opened directly from file:// in some browsers)
 *
 * Adding a new guide = one line in navbar-manifest.json. No JS edits needed.
 */
(function () {
  'use strict';

  // ---------- Built-in fallback (mirror of navbar-manifest.json) ----------
  var FALLBACK = {
    site: { title: 'justtellmehowto', home: 'index.html' },
    links: [
      { label: 'Squirrel Exclusion', href: 'protect-garden-from-squirrels.html',
        blurb: 'Peanut patch · three methods' },
      { label: 'Rabbit Run — DIY', href: 'rabbit-run-plan.html',
        blurb: '8 × 8 walk-in · from scratch' },
      { label: 'Rabbit Run — Kit', href: 'rabbit-run-kit-plan.html',
        blurb: '12 × 9 walk-in · kit upgrades' }
    ]
  };

  // ---------- Style loader (cached, idempotent) ----------
  var STYLE_ID = 'jtn-navbar-styles';
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = new URL('navbar.css', currentScriptUrl()).href;
    document.head.appendChild(link);
  }

  // Resolve the URL of this script. In a classic script with `defer`,
  // document.currentScript is the tag that included us. Fall back to
  // document.baseURI for the (rare) case it isn't available.
  function currentScriptUrl() {
    var s = document.currentScript;
    if (s && s.src) return s.src;
    return new URL('assets/navbar.js', document.baseURI).href;
  }

  // ---------- DOM builders ----------
  // Safe by default: every key in `attrs` (other than `text`) is set as an
  // HTML attribute via setAttribute. This covers aria-*, data-*, role, etc.
  // with no risk of an attacker-controlled manifest value being assigned to a
  // DOM property (e.g. `innerHTML` is never reachable from here).
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') {
          node.textContent = attrs[k];
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function buildNavbar(data) {
    var here = location.pathname.split('/').pop() || '';

    var homeHref = (data.site && data.site.home) || 'index.html';
    var homeLabel = (data.site && data.site.title) || 'justtellmehowto';

    // Two-line brand: a small field-bulletin mark over a display-font site name.
    // Mirrors the bulletin + h1 stack used by each guide's own <header>.
    var home = el('a', { class: 'jtn-home', href: homeHref, title: homeLabel, 'aria-label': homeLabel + ' — home' }, [
      el('span', { class: 'jtn-home-mark', text: 'Field Bulletin · Index' }),
      el('span', { class: 'jtn-home-title', text: homeLabel })
    ]);

    var list = el('ul', { class: 'jtn-links', role: 'list' });

    // Small "Guides" caption to the left of the link group.
    list.appendChild(el('li', { class: 'jtn-links-label', 'aria-hidden': 'true', text: 'Guides' }));

    (data.links || []).forEach(function (item) {
      if (!item || !item.href) return;
      var isCurrent = here === item.href ||
        (item.href === '' && (here === '' || here === 'index.html'));
      var attrs = {
        class: 'jtn-link',
        href: item.href,
        title: item.blurb || item.label
      };
      if (isCurrent) attrs['aria-current'] = 'page';
      list.appendChild(el('li', null, [ el('a', attrs, [ el('span', { text: item.label }) ]) ]));
    });

    var burger = el('button', {
      class: 'jtn-burger',
      type: 'button',
      'aria-label': 'Toggle guide menu',
      'aria-expanded': 'false',
      text: 'Guides'
    });

    var bar = el('nav', {
      class: 'jtn-bar',
      role: 'navigation',
      'aria-label': 'Guide navigation'
    }, [
      el('div', { class: 'jtn-inner' }, [
        home,
        list,
        burger
      ])
    ]);

    burger.addEventListener('click', function () {
      var open = bar.getAttribute('data-open') === 'true';
      bar.setAttribute('data-open', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
    });

    return bar;
  }

  // ---------- Manifest loader ----------
  function loadManifest() {
    return new Promise(function (resolve) {
      var url = new URL('navbar-manifest.json', currentScriptUrl()).href;
      // Some browsers block fetch() on file://. Probe quietly and fall back.
      if (typeof fetch !== 'function') { resolve(FALLBACK); return; }
      fetch(url, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { resolve(j && j.links ? j : FALLBACK); })
        .catch(function () { resolve(FALLBACK); });
    });
  }

  // ---------- Mount ----------
  function mount() {
    ensureStyles();
    loadManifest().then(function (data) {
      var bar = buildNavbar(data);
      if (!document.body) return;
      // Insert as the first child of <body> so page CSS that targets
      // body > .wrap still works (the .wrap content remains the only
      // direct sibling after the navbar).
      document.body.insertBefore(bar, document.body.firstChild);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
