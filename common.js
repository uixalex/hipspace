// ---------- shared across every page ----------
// Loaded before the per-page script (script.js on home, case-study.js on a case
// study), so anything declared here is available to it.

// Work rows link straight to `site` (the live project) for now. `src` is the
// hover peek image — a project without one simply shows no peek card, so adding
// the file later is enough to bring it back.
// `hero`, `gallery` and `body` feed case-study.html, which is finished but not
// linked from the site yet: those get filled in per project as case studies are written.
const PROJECTS = [
  { n: "01", name: "MOKE",          meta: "Visual Identity & Web Design", src: "assets/moke-cover.webp",      site: "https://mokeinternational.com/",  gallery: [], body: "An electric-vehicle brand with a beach-club soul, brought to life through a playful and immersive website." },
  { n: "02", name: "Moving Portal", meta: "Visual Identity & Web Design", src: "assets/moving-portal.webp", site: "https://themovingportal.co.uk/",  gallery: [], body: "" },
  { n: "03", name: "Bytek",         meta: "Branding & Web Design", src: "assets/bytek.webp",         site: "https://bytek.ba/",               gallery: [], body: "" },
  { n: "04", name: "Rello",         meta: "Visual Identity & Web Design", src: "assets/rello.webp",         site: "https://rello.co.uk/",            gallery: [], body: "" },
  { n: "05", name: "OOEJ",          meta: "Web Design", src: "assets/ooej.webp",          site: "https://ooej.org/",               gallery: [], body: "" },
  { n: "06", name: "RAWR",          meta: "Web Design", src: "assets/rawr.webp",          site: "https://rawr-fawn.vercel.app/",   gallery: [], body: "" },
  { n: "07", name: "Rubedo",        meta: "Web Design", src: "assets/rubedo.webp",        site: "https://www.rubedolife.com/",     gallery: [], body: "" },
  { n: "08", name: "Quackables",    meta: "Branding & Web Design", src: "assets/quackables.webp",    site: "https://quackables.vercel.app/",  gallery: [], body: "" },
  { n: "09", name: "Oxford Permanent Makeup", meta: "Web Design", src: "assets/oxford-pmu.webp", site: "https://oxfordpermanentmakeup.co.uk/", gallery: [], body: "" }
];

// Hover-only behaviour is gated on this: a touchscreen reports no hover, and
// the emulated mouse events it does fire would otherwise trigger mouse effects.
const CAN_HOVER = window.matchMedia('(hover: hover)').matches;

// ---------- work rows ----------
// Shared by the home work list and the “more work” list on a case study.
function buildWorkRows(container, projects) {
  projects.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'work-row';
    // no image yet means no peek: the row still works, and dropping the file in
    // later is all it takes to bring the saucer and card back.
    // A real <img> rather than a background: it carries alt text, can turn up in
    // image search, and lazy-loads instead of downloading behind an opacity:0 card.
    const peek = p.src ? `
        <div class="work-peek">
          <div class="work-peek-saucer-wrap">
            <img class="work-peek-saucer" src="assets/saucer-blue.png" alt="" style="animation-delay:${i * 0.3}s" />
          </div>
          <div class="work-peek-beam"></div>
          <div class="work-peek-card" style="animation-delay:${i * 0.4}s">
            <img class="work-peek-img" src="${p.src}"
                 alt="${p.name} — ${p.meta} by Hipspace"
                 loading="lazy" decoding="async" />
          </div>
        </div>` : '';
    row.innerHTML = `
      <a class="work-row-inner" href="${p.site}" target="_blank" rel="noopener noreferrer">
        <span class="work-n">${p.n}</span>
        <h3 class="work-name">${p.name}</h3>
        <span class="work-end">
          <span class="work-meta">${p.meta}</span>
          <span class="work-arrow" aria-hidden="true">↗</span>
        </span>
${peek}
      </a>
    `;
    attachPeekParallax(row);
    container.appendChild(row);
  });
}

// ---------- work peek parallax ----------
const PEEK_X = 14, PEEK_Y = 8, PEEK_EASE = 0.12;
let peekRow = null, peekSettleRow = null, peekRaf = null;
const peekTarget = { x: 0, y: 0 };
const peekCur = { x: 0, y: 0 };

function peekLoop() {
  peekCur.x += (peekTarget.x - peekCur.x) * PEEK_EASE;
  peekCur.y += (peekTarget.y - peekCur.y) * PEEK_EASE;
  const settled = Math.abs(peekTarget.x - peekCur.x) < 0.1 && Math.abs(peekTarget.y - peekCur.y) < 0.1;
  if (peekRow) {
    peekRow.style.setProperty('--px', peekCur.x.toFixed(2) + 'px');
    peekRow.style.setProperty('--py', peekCur.y.toFixed(2) + 'px');
    peekRaf = requestAnimationFrame(peekLoop);
    return;
  }
  // no active row: keep easing the last one back to rest, then clean up
  if (peekSettleRow) {
    if (settled) {
      peekSettleRow.style.removeProperty('--px');
      peekSettleRow.style.removeProperty('--py');
      peekSettleRow = null;
    } else {
      peekSettleRow.style.setProperty('--px', peekCur.x.toFixed(2) + 'px');
      peekSettleRow.style.setProperty('--py', peekCur.y.toFixed(2) + 'px');
    }
  }
  peekRaf = peekSettleRow ? requestAnimationFrame(peekLoop) : null;
}

function startPeekLoop() { if (peekRaf === null) peekRaf = requestAnimationFrame(peekLoop); }

function attachPeekParallax(row) {
  row.addEventListener('mouseenter', () => {
    if (peekSettleRow && peekSettleRow !== row) {
      peekSettleRow.style.removeProperty('--px');
      peekSettleRow.style.removeProperty('--py');
    }
    peekSettleRow = null;
    peekRow = row;
    peekCur.x = 0; peekCur.y = 0;
    peekTarget.x = 0; peekTarget.y = 0;
    startPeekLoop();
  });
  row.addEventListener('mousemove', (e) => {
    if (peekRow !== row) return;
    const r = row.getBoundingClientRect();
    peekTarget.x = ((e.clientX - r.left) / r.width * 2 - 1) * PEEK_X;
    peekTarget.y = ((e.clientY - r.top) / r.height * 2 - 1) * PEEK_Y;
    startPeekLoop();
  }, { passive: true });
  row.addEventListener('mouseleave', () => {
    if (peekRow !== row) return;
    peekRow = null;
    peekSettleRow = row;
    peekTarget.x = 0; peekTarget.y = 0;
    startPeekLoop();
  });
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
    e.target.querySelectorAll(':scope > .work-row, :scope > .service-row, :scope > .faq-item')
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
