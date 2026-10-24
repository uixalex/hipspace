// ---------- shared across every page ----------
// Loaded before the per-page script (script.js on home, case-study.js on a case
// study), so anything declared here is available to it.

// Work rows link straight to `site` (the live project) for now. `src` is the
// hover peek image — a project without one simply shows no peek card, so adding
// the file later is enough to bring it back.
// `hero`, `gallery` and `body` feed case-study.html; a project with
// `caseStudy: true` links there instead of to its live site. A gallery entry is a
// path, or { src, wide: true } for a full-width image (the first one always is).
// `scope` lists what was done; without it the case study splits up `meta`.
const PROJECTS = [
  { n: "01", name: "MOKE",          meta: "Visual Identity & Web Design", src: "assets/moke-cover.webp",      site: "https://mokeinternational.com/",  gallery: [], body: "An electric-vehicle brand with a beach-club soul, brought to life through a playful and immersive website." },
  { n: "02", name: "Moving Portal", meta: "Visual Identity & Web Design", src: "assets/moving-portal.webp", site: "https://themovingportal.co.uk/",  gallery: [], body: "" },
  { n: "03", name: "Bytek",         meta: "Branding & Web Design", src: "assets/bytek.webp",         site: "https://bytek.ba/",               gallery: [], body: "" },
  { n: "04", name: "Rello",         meta: "Product, Web & Visual Identity", src: "assets/rello.webp",         site: "https://rello.co.uk/",
    caseStudy: true, hero: "assets/rello-phone.jpg",
    scope: ["Product strategy", "UX research & flows", "Web platform UI", "Mobile app UI", "Design system", "Visual identity", "Marketing website"],
    gallery: [
      "assets/case-rello-website.webp",
      "assets/rello-app-icon.png",
      "assets/rello-home-screen.jpg",
      { src: "assets/rello-color.png", wide: true },
      { src: "assets/rello-dashboard.jpg", wide: true },
      { src: "assets/rello-desktop-screens.jpg", wide: true },
      { src: "assets/rello-app-screens.jpg", wide: true },
      { src: "assets/case-rello-social.jpg", wide: true }
    ],
    body: "Rello takes the stress out of buying and selling a home in the UK. We designed the product from the ground up: a web platform and a mobile app that let estate agents, lawyers and their clients follow the whole property chain in one place, with a status colour for every stage, so anyone can see at a glance who is ready to exchange. Around it we built the visual identity, from the house-shaped e of the logo to the navy and teal palette, and the marketing website that brings it all together." },
  { n: "05", name: "OOEJ",          meta: "Web Design", src: "assets/ooej.webp",          site: "https://ooej.org/",               gallery: [], body: "" },
  { n: "06", name: "RAWR",          meta: "Web Design", src: "assets/rawr.webp",          site: "https://rawr-fawn.vercel.app/",   gallery: [], body: "" },
  { n: "07", name: "Rubedo",        meta: "Web Design", src: "assets/rubedo.webp",        site: "https://www.rubedolife.com/",     gallery: [], body: "" },
  { n: "08", name: "Quackables",    meta: "Branding & Web Design", src: "assets/quackables.webp",    site: "https://quackables.vercel.app/",  gallery: [], body: "" }
];

// Hover-only behaviour is gated on this: a touchscreen reports no hover, and
// the emulated mouse events it does fire would otherwise trigger mouse effects.
const CAN_HOVER = window.matchMedia('(hover: hover)').matches;

// where a work row goes: the case study once it's written, the live site until then
function projectLink(p) {
  return p.caseStudy
    ? `href="case-study.html?p=${p.n}"`
    : `href="${p.site}" target="_blank" rel="noopener noreferrer"`;
}

// ---------- work grid ----------
// Big project cards: a wide one and a narrow one per row, the wide one
// swapping sides each row. Hovering a card brings a pill to the pointer.
function buildWorkGrid(grid, list) {
  grid.innerHTML = list.map((p, i) => {
    // rows go wide-narrow, narrow-wide, wide-narrow …
    const wide = (i % 4 === 0 || i % 4 === 3);
    // an odd last card has its row to itself, so it takes the full width
    const full = list.length % 2 === 1 && i === list.length - 1;
    return `
    <a class="wk-card2${full ? ' is-full' : wide ? ' is-wide' : ''}" ${projectLink(p)}>
      <span class="wk-media2">
        <img src="${p.src}" alt="${p.name}: ${p.meta} by Hipspace" loading="lazy" decoding="async" />
      </span>
      <span class="wk-meta2">
        <span class="wk-name2">${p.name}</span>
        <span class="sec-label">${p.meta}</span>
        <span class="wk-go" aria-hidden="true">${p.caseStudy ? '&#8594;' : '&#8599;'}</span>
      </span>
    </a>`;
  }).join('');

  // the pill trails the pointer a little, and only shows over a card
  const pill = document.getElementById('wk-cursor');
  if (!pill || !CAN_HOVER) return;
  let x = 0, y = 0, tx = 0, ty = 0, raf = null;
  const follow = () => {
    x += (tx - x) * .2; y += (ty - y) * .2;
    pill.style.transform = `translate(${x}px, ${y}px)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > .3 ? requestAnimationFrame(follow) : null;
  };
  grid.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!pill.classList.contains('is-on')) { x = tx; y = ty; }
    if (raf === null) raf = requestAnimationFrame(follow);
  });
  grid.querySelectorAll('.wk-card2').forEach(card => {
    card.addEventListener('pointerenter', () => {
      pill.textContent = card.getAttribute('target') ? 'Visit site' : 'View case study';
      pill.classList.add('is-on');
    });
    card.addEventListener('pointerleave', () => pill.classList.remove('is-on'));
  });
}

// ---------- project cards ----------
// The “more work” list under a case study: the same cards as the home work
// grid, picture, name, kind of work and a round arrow.
function buildProjectCards(container, projects) {
  container.innerHTML = projects.map(p => `
    <a class="wk-card2" ${projectLink(p)}>
      <span class="wk-media2">${p.src ? `<img src="${p.src}" alt="${p.name}: ${p.meta} by Hipspace" loading="lazy" decoding="async" />` : ''}</span>
      <span class="wk-meta2">
        <span class="wk-name2">${p.name}</span>
        <span class="sec-label">${p.meta}</span>
        <span class="wk-go" aria-hidden="true">${p.caseStudy ? '&#8594;' : '&#8599;'}</span>
      </span>
    </a>`).join('');
}

// ---------- accordion panels ----------
// height: auto cannot be animated, so the open height is measured and set in px,
// then swapped to auto once the transition lands (so the panel still reflows if
// the window is resized). Closing goes back to px first, or there is nothing to
// animate from.
function setPanel(wrap, open) {
  if (!wrap) return;
  const inner = wrap.firstElementChild;
  if (!inner) return;

  // released to 'auto' only once the height has actually finished easing,
  // so the text can still reflow (a resize) without the panel cutting it off
  if (!wrap._panelEnd) {
    wrap._panelEnd = (ev) => {
      if (ev.target === wrap && ev.propertyName === 'height' && wrap.dataset.open === '1') {
        wrap.style.height = 'auto';
      }
    };
    wrap.addEventListener('transitionend', wrap._panelEnd);
  }

  clearTimeout(wrap._panelT);
  if (open) {
    if (wrap.dataset.open === '1') return;
    wrap.dataset.open = '1';
    wrap.style.height = inner.offsetHeight + 'px';
    // backstop for when no transitionend comes (no transition to run, or
    // reduced motion): release a little after the longest curve would end
    wrap._panelT = setTimeout(() => {
      if (wrap.dataset.open === '1') wrap.style.height = 'auto';
    }, 900);
  } else {
    if (wrap.dataset.open !== '1') return;
    wrap.dataset.open = '0';
    // from auto there is no start value to ease out of: pin the current
    // height, force a reflow, then collapse
    wrap.style.height = wrap.offsetHeight + 'px';
    void wrap.offsetHeight;
    wrap.style.height = '0px';
  }
}

// ---------- footer ----------
// One source of truth: every page carries an empty #site-footer and gets the
// markup from here, so a new page never has to copy it.
function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  // menu, social, contact, then the launch block
  // the menu column follows the page's own nav, so its hrefs stay right per page
  const menu = [...document.querySelectorAll('.nav-links a')]
    .map(a => `<a href="${a.getAttribute('href')}">${a.textContent.trim()}</a>`).join('');
  mount.innerHTML = `
    <footer id="contact">
      <!-- black pixels breaking up into the white section above (gen.js) -->
      <div class="footer-field" aria-hidden="true"><canvas class="px-edge"></canvas></div>
      <div class="footer-top">
        <div class="footer-col reveal" style="--d:0s">
          <span class="footer-h">Menu</span>
          ${menu}
        </div>
        <div class="footer-col reveal" style="--d:.08s">
          <span class="footer-h">Social</span>
          <a href="https://www.instagram.com/hipspace.studio/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.linkedin.com/company/hipspace/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
        <div class="footer-col footer-contact reveal" style="--d:.16s">
          <span class="footer-h">Contact</span>
          <a class="footer-mail" href="mailto:alex@hipspacestudio.com">alex@hipspacestudio.com</a>
        </div>
        <div class="footer-launch-wrap reveal" style="--d:.24s"><a class="sys-btn footer-launch" href="inquiry.html">let's launch <span aria-hidden="true">&rarr;</span></a></div>
      </div>

      <!-- the wordmark across the full width (common.js fits it to the width) -->
      <div class="footer-mark" id="footer-mark" aria-hidden="true">${[...'HIPSPACE'].map((c, k) => `<span style="--k:${k}">${c}</span>`).join('')}</div>

      <div class="footer-bottom">
        <span>&copy; 2026 hipspacestudio</span>
      </div>
    </footer>
  `;

  // HIPSPACE runs exactly edge to edge, whatever the screen
  const mark = document.getElementById('footer-mark');
  const fit = () => {
    mark.style.fontSize = '100px';
    mark.style.display = 'inline-flex';
    // the mark carries the side gutters as padding: measure the letters alone
    const pad = parseFloat(getComputedStyle(mark).paddingLeft) * 2;
    const w = mark.getBoundingClientRect().width - pad;
    mark.style.display = '';
    const avail = mark.parentElement.clientWidth - pad;
    if (w) mark.style.fontSize = (100 * avail / w).toFixed(2) + 'px';
  };
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts) document.fonts.ready.then(fit);

}
renderFooter();

// ---------- mobile nav ----------
// Built from the nav that is already on the page, so each page keeps its own
// hrefs (the case study points back at index.html) with no duplicated markup.
function renderMobileNav() {
  const navInner = document.querySelector('.nav-inner');
  if (!navInner || document.querySelector('.mnav')) return;

  const links = [...document.querySelectorAll('.nav-links a')]
    .map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
  if (!links.length) return;

  const launch = document.querySelector('.nav-right .nav-cta');
  const logo = document.querySelector('.logo');
  const logoHref = logo ? logo.getAttribute('href') : 'index.html';

  const burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Open menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span><span></span><span></span>';
  navInner.appendChild(burger);

  const mnav = document.createElement('div');
  mnav.className = 'mnav';
  mnav.hidden = false;
  mnav.innerHTML = `
    <div class="mnav-bar">
      <a href="${logoHref}" class="logo">HIPSPACE</a>
      <button class="mnav-close" type="button" aria-label="Close menu"><span></span><span></span></button>
    </div>
    <nav class="mnav-links">
      ${links.map((l, i) => `<a href="${l.href}" style="--d:${i * 70}ms"><span class="n">${String(i + 1).padStart(2, '0')}</span>${l.text}</a>`).join('')}
    </nav>
    <div class="mnav-foot">${launch ? `<a class="cta-pill" href="${launch.getAttribute('href')}">${launch.textContent.trim()}</a>` : ''}</div>
  `;
  document.body.appendChild(mnav);

  const setOpen = (open) => {
    mnav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setOpen(true));
  mnav.querySelector('.mnav-close').addEventListener('click', () => setOpen(false));
  // any link closes it: same-page anchors would otherwise scroll behind the overlay
  mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}
renderMobileNav();

// ---------- link roll ----------
// After renderMobileNav(): it reads these labels, and must get them single.
// Each nav label gets a copy underneath; on hover the pair slides up (CSS).
function addLinkRoll() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.nav-links a, .nav-cta').forEach(a => {
    if (a.querySelector('.roll')) return;
    const label = a.textContent.trim();
    a.setAttribute('aria-label', label);
    a.innerHTML = `<span class="roll" aria-hidden="true"><span>${label}</span><span>${label}</span></span>`;
  });
}
addLinkRoll();

// ---------- scroll reveal ----------
// After renderFooter(): the footer columns carry .reveal and must be observed too.
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    // rows are built by the page script after this observer is set up, so the
    // cascade delays are stamped on here, once the list is actually on screen
    e.target.querySelectorAll(':scope > .work-row, :scope > .service-row, :scope > .faq-item, :scope > .pr-step, :scope > .wk-card2')
      .forEach((row, i) => row.style.setProperty('--rd', Math.min(i, 8) * 80 + 'ms'));
    e.target.classList.add('in-view');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal, .reveal-lines').forEach(el => io.observe(el));

// stagger the children of .reveal-lines so headings arrive line by line
document.querySelectorAll('.reveal-lines').forEach(el => {
  Array.from(el.children).forEach((child, i) => child.style.setProperty('--d', (i * 90) + 'ms'));
});

// The observer only fires when an element crosses the viewport edge. A jump
// straight to a hash (index.html#work) can move a heading from below the fold to
// above it in one go, crossing nothing, so it would stay invisible for good.
// This sweep shows anything on screen or already scrolled past; whatever is
// still below the fold keeps its entrance.
function revealVisible() {
  document.querySelectorAll('.reveal:not(.in-view)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) el.classList.add('in-view');
  });
}
setTimeout(revealVisible, 1200);
window.addEventListener('hashchange', revealVisible);
let sweepQueued = false;
window.addEventListener('scroll', () => {
  if (sweepQueued) return;
  sweepQueued = true;
  requestAnimationFrame(() => { sweepQueued = false; revealVisible(); });
}, { passive: true });
