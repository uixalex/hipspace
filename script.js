// ---------- data ----------

// PROJECTS lives in common.js: the case study page reads it too.


// CAN_HOVER comes from common.js
// How long the pointer has to settle on a row before it opens. Anything above
// zero is enough to stop a list shifting under a pointer on its way past.
const HOVER_INTENT = 110;

// ---------- smooth scroll ----------
const STILL = window.matchMedia('(prefers-reduced-motion: reduce)');
const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
// Smooth wheel scrolling for the whole page. Touch keeps the phone's own
// native scroll (Lenis leaves it alone by default), and so does anyone who
// has asked their system for less motion.
let lenis = null;
if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
if (window.Lenis && !STILL.matches) {
  lenis = new Lenis({ lerp: .085 });
  if (HAS_GSAP) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // same-page links glide there through Lenis instead of jumping
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    const id = a && a.getAttribute('href');
    const target = id && id.length > 1 && document.querySelector(id);
    if (!target) return;
    ev.preventDefault();
    lenis.scrollTo(target, { duration: 1.4 });
  });
}

// ---------- opening ----------
// Two labels type in and every letter of HIPSPACE spins through other letters
// like a counter wheel, stopping on its own one after another while a counter
// runs to 100. Then the reel comes up from the bottom like a curtain and the
// headline types in above it. Scrolling is only held while the counter runs,
// and any wheel, touch or key press skips straight to the end.
const hero = document.getElementById('hero');
const media = document.getElementById('hero-media');
// the hero visual: the generative canvas now, a <video> if one goes back in
const video = media.querySelector('video, canvas');
const word = document.getElementById('loader-word');

// the word runs the full width of the content, whatever the screen
function fitWord() {
  const base = word.querySelector('.loader-base');
  // measured as inline-block: a block's width is its box, not its text
  base.style.setProperty('--word', '100px');
  base.style.display = 'inline-block';
  const w = base.getBoundingClientRect().width;
  const avail = word.clientWidth;
  base.style.removeProperty('--word');
  base.style.removeProperty('display');
  if (w) word.style.setProperty('--word', (100 * avail / w).toFixed(2) + 'px');
}
fitWord();
window.addEventListener('resize', fitWord);
if (document.fonts) document.fonts.ready.then(fitWord);

// Splits an element's text into letters (keeping <br>s) so it can be typed
// out; returns the letters in order.
function splitForTyping(el) {
  const out = [];
  [...el.childNodes].forEach(node => {
    if (node.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    [...node.textContent].forEach(ch => {
      const span = document.createElement('span');
      span.className = 'tc';
      span.textContent = ch;
      frag.appendChild(span);
      out.push(span);
    });
    node.replaceWith(frag);
  });
  return out;
}
// adds a typing run to a timeline: one letter every `each` seconds
function typeInto(tl, letters, at, each) {
  letters.forEach((l, i) => tl.call(() => l.classList.add('on'), null, at + i * each));
}

function heroParallax() {
  if (!HAS_GSAP || STILL.matches) return;
  // only a real video drifts; the generative canvas fills its band exactly,
  // and moving it would open a gap under the menu
  if (video && video.tagName === 'VIDEO') gsap.to(video, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

// ---- entrance: the menu slides down, the headline rises line by line out of
// its mask, the reel opens from the bottom and settles out of a slight zoom
function enter() {
  const root = document.documentElement;
  if (!root.classList.contains('enter')) { heroParallax(); return; }
  if (!HAS_GSAP) { root.classList.remove('enter'); return; }
  const h1 = document.getElementById('hero-h1');
  // one masked line per <br>-separated line of the headline
  h1.innerHTML = h1.innerHTML.split(/<br\s*\/?>/i)
    .map(line => `<span class="hl"><span>${line.trim()}</span></span>`).join('');
  const lines = h1.querySelectorAll('.hl > span');
  const nav = document.querySelector('.hero-panel .nav');
  gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete() {
      root.classList.remove('enter');
      gsap.set([nav, media, ...lines], { clearProps: 'all' });
      gsap.set(video, { clearProps: 'transform' });
      heroParallax();
    }
  })
    // y: 0 replaces the CSS hiding offset, or GSAP would add the two together
    .fromTo(nav, { y: 0, yPercent: -100 }, { y: 0, yPercent: 0, duration: 1.1 }, 0)
    .set(h1, { visibility: 'visible' }, .15)
    .fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: 1.2, stagger: .1 }, .15)
    .fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, .25)
    .fromTo(video, { scale: 1.15 }, { scale: 1, duration: 1.8 }, .25);
}

(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) { enter(); return; }
  // no GSAP, no opening: start finished
  if (!HAS_GSAP) { root.classList.remove('intro', 'intro-lock'); return; }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  if (lenis) lenis.stop();

  const labels = gsap.utils.toArray('.loader-meta .type').map(splitForTyping);
  const h1 = document.getElementById('hero-h1');
  const titleLetters = splitForTyping(h1);
  const nav = document.querySelector('.hero-panel .nav');
  const count = document.getElementById('loader-count');

  // one reel per letter: a column of other letters that ends on the real one
  const POOL = 'HIPSACE';
  const reels = document.createElement('span');
  reels.className = 'loader-reels';
  const cols = [...'HIPSPACE'].map((ch, i) => {
    const reel = document.createElement('span');
    reel.className = 'reel';
    const n = 9 + i * 2;   // later letters spin longer, so they land in order
    // starts on an empty cell, so the window is blank until the wheel turns
    let cells = '<span>&nbsp;</span>';
    for (let k = 0; k < n; k++) cells += `<span>${POOL[Math.floor(Math.random() * POOL.length)]}</span>`;
    reel.innerHTML = `<span class="reel-size">${ch}</span><span class="reel-col">${cells}<span>${ch}</span></span>`;
    reels.appendChild(reel);
    return { col: reel.lastElementChild, cells: n + 2 };
  });
  word.appendChild(reels);
  word.classList.add('has-reels');

  gsap.set(media, { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(video, { scale: 1.18 });

  // ---- in: labels type, the wheels spin and land left to right, the counter runs
  const intro = gsap.timeline();
  typeInto(intro, labels[0], .2, .07);
  typeInto(intro, labels[1], .5, .045);
  cols.forEach(({ col, cells }, i) => {
    intro.fromTo(col,
      { yPercent: 0 },
      { yPercent: -100 * (cells - 1) / cells, duration: 2 + i * .12, ease: 'expo.inOut' },
      .4 + i * .08);
  });
  const SPIN_END = .4 + 7 * .08 + 2 + 7 * .12;
  const counter = { v: 0 };
  intro.to(counter, {
    v: 100, duration: SPIN_END - .4, ease: 'expo.inOut',
    onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); }
  }, .4);

  // ---- the counter done, straight on: the reel needn't be fully loaded to start
  intro.call(out, null, SPIN_END + .25);

  // ---- any attempt to scroll during the opening skips it
  let outTl = null;
  const skip = () => {
    if (!outTl) intro.progress(1);
    if (outTl) outTl.timeScale(4);
    stopListening();
  };
  const SKIP_EVENTS = ['wheel', 'touchstart', 'keydown'];
  const stopListening = () => SKIP_EVENTS.forEach(e => window.removeEventListener(e, skip));
  SKIP_EVENTS.forEach(e => window.addEventListener(e, skip, { passive: true }));

  // ---- out: the reel comes up from the bottom to half, the headline types in
  function out() {
    if (outTl) return;
    if (video.play) video.play().catch(() => {});
    // the page scrolls again as soon as the curtain starts
    root.classList.remove('intro-lock');
    if (lenis) lenis.start();
    const tl = outTl = gsap.timeline({
      onComplete() {
        stopListening();
        root.classList.remove('intro');
        gsap.set(media, { clearProps: 'clipPath,visibility,opacity' });
        gsap.set(nav, { clearProps: 'transform' });
        document.getElementById('loader').style.display = 'none';
        heroParallax();
      }
    });
    tl.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
      .to(video, { scale: 1, duration: 2.2, ease: 'expo.out' }, .4)
      .set(h1, { visibility: 'visible' }, 1.2);
    typeInto(tl, titleLetters, 1.2, .045);
    // the menu comes down once, as one bar, while the reel rises
    tl.fromTo(nav, { yPercent: -100 }, { yPercent: 0, duration: 1, ease: 'power3.out' }, .5);
  }
})();

// ---------- hero reel ----------
// The showreel only plays while the hero is on screen and the tab is in front:
// a 1080p video decoding behind the rest of the page costs battery for nothing.
// Anyone who asked their system for less motion gets it standing still.
(() => {
  if (!video || video.tagName !== 'VIDEO') return;
  let visible = true;
  function sync() {
    const run = visible && !document.hidden && !STILL.matches;
    if (run && video.paused) video.play().catch(() => {});
    if (!run && !video.paused) video.pause();
  }
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(hero);
  sync();
})();

// ---------- services ----------
// The rows live in index.html so search engines see the copy without running
// any JavaScript; this only wires up the behaviour.
document.querySelectorAll('.service-row').forEach(row => {
  const wrap = row.querySelector('.service-body-wrap');
  const setOpen = (open) => {
    row.classList.toggle('open', open);
    setPanel(wrap, open);
  };
  const toggle = () => {
    const willOpen = !row.classList.contains('open');
    // only one open at a time, and the others have to collapse their panel too
    document.querySelectorAll('.service-row.open').forEach(r => {
      if (r === row) return;
      r.classList.remove('open');
      setPanel(r.querySelector('.service-body-wrap'), false);
    });
    setOpen(willOpen);
  };
  row.addEventListener('click', toggle);
  if (CAN_HOVER) {
    // Hover opens, but only once the pointer settles. Opening the instant it
    // crossed an item meant reaching for the fourth pushed everything down as
    // you passed the second, and the list ran away from you.
    // Closing waits exactly as long: moving from one row to the next, the old
    // one used to snap shut 110ms before the new one opened, so the whole list
    // dipped and came back up under the pointer. Now one closes in the same
    // frame the other opens, on the same curve, and the list just glides.
    let intent, closing;
    row.addEventListener('mouseenter', () => {
      clearTimeout(intent);
      clearTimeout(closing);
      intent = setTimeout(() => setOpen(true), HOVER_INTENT);
    });
    row.addEventListener('mouseleave', () => {
      clearTimeout(intent);
      clearTimeout(closing);
      closing = setTimeout(() => setOpen(false), HOVER_INTENT);
    });
  }
});

// ---------- work ----------
// The first projects on the home page; work.html shows them all (buildWorkGrid
// lives in common.js).
const HOME_WORK = 4;
buildWorkGrid(document.getElementById('wk-grid'), PROJECTS.filter(p => p.src).slice(0, HOME_WORK));

// ---------- FAQ ----------
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const wrap = item.querySelector('.faq-a-wrap');
  const open = (willOpen) => {
    item.classList.toggle('open', willOpen);
    setPanel(wrap, willOpen);
  };
  q.addEventListener('click', () => open(!item.classList.contains('open')));
  if (CAN_HOVER) {
    // same timing as the services: close as late as the next one opens
    let intent, closing;
    item.addEventListener('mouseenter', () => {
      clearTimeout(intent);
      clearTimeout(closing);
      intent = setTimeout(() => open(true), HOVER_INTENT);
    });
    item.addEventListener('mouseleave', () => {
      clearTimeout(intent);
      clearTimeout(closing);
      closing = setTimeout(() => open(false), HOVER_INTENT);
    });
  }
});

// ---------- FAQ structured data ----------
// Read straight off the rendered questions, so the copy has one home. Google can show these as expandable questions in the search result.
(() => {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...document.querySelectorAll('.faq-item')].map(item => ({
      "@type": "Question",
      name: item.querySelector('.faq-q h3').textContent.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: item.querySelector('.faq-a-inner p').textContent.trim()
      }
    }))
  };
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(ld);
  document.head.appendChild(tag);
})();
