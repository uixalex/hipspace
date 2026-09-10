// ---------- data ----------

// PROJECTS lives in common.js: the case study page reads it too.


// CAN_HOVER comes from common.js
// How long the pointer has to settle on a row before it opens. Anything above
// zero is enough to stop a list shifting under a pointer on its way past.
const HOVER_INTENT = 110;

// ---------- build starfield ----------
// Each layer is 200% wide: stars are placed in the left half and cloned into the
// right half, so the CSS starFly drift (translateX -50%) loops without a seam.
function buildStars(el, count, minSize, maxSize, dim) {
  if (!el) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    const size = (minSize + Math.random() * (maxSize - minSize)).toFixed(2);
    const left = Math.random() * 50;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.top = (Math.random() * 100).toFixed(2) + '%';
    star.style.animationDuration = (3.5 + Math.random() * 4.5).toFixed(2) + 's';
    star.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
    if (dim) star.style.background = 'rgba(255,255,255,.72)';
    else if (Math.random() > 0.7) star.style.boxShadow = '0 0 6px rgba(255,255,255,.8)';
    const twin = star.cloneNode(false);
    star.style.left = left.toFixed(2) + '%';
    twin.style.left = (left + 50).toFixed(2) + '%';
    frag.appendChild(star);
    frag.appendChild(twin);
  }
  el.appendChild(frag);
}
// every star is cloned for the seamless loop, so these counts double in the DOM
// and each one carries an infinite twinkle animation: halved on touch
const S = CAN_HOVER ? 1 : 0.5;
buildStars(document.querySelector('.stars-far'), 90 * S, 1, 1.6, true);
buildStars(document.querySelector('.stars-near'), 45 * S, 1.6, 2.6, false);
buildStars(document.querySelector('.stars-alex'), 70 * S, 1, 1.8, true);
buildStars(document.querySelector('.stars-about'), 60 * S, 1, 1.8, true);
buildStars(document.querySelector('.stars-cta'), 50 * S, 1, 1.8, true);

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
    let intent;
    row.addEventListener('mouseenter', () => {
      clearTimeout(intent);
      intent = setTimeout(() => setOpen(true), HOVER_INTENT);
    });
    row.addEventListener('mouseleave', () => {
      clearTimeout(intent);
      setOpen(false);
    });
  }
});

// ---------- build work list ----------
// buildWorkRows + the peek parallax live in common.js: the case study reuses them
buildWorkRows(document.getElementById('work-list'), PROJECTS);

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
    let intent;
    item.addEventListener('mouseenter', () => {
      clearTimeout(intent);
      intent = setTimeout(() => open(true), HOVER_INTENT);
    });
    item.addEventListener('mouseleave', () => {
      clearTimeout(intent);
      open(false);
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

// ---------- scroll reveal ----------
// the generic .reveal observer lives in common.js; this is the home-only part.
// About-me content enters as one calm sequence: heading, text, then CTA.
const alexSection = document.getElementById('alex');
const alexIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    alexIo.unobserve(e.target);
    // the CTA is last at 520ms + .5s; after that the stagger delays must go,
    // or they would also hold up the button's hover
    setTimeout(() => e.target.classList.add('seq-done'), 1400);
  });
}, { threshold: 0.25 });
alexIo.observe(alexSection);

// ---------- UFO beam toggle (day/night easter egg) ----------
const hero = document.getElementById('hero');
const beamToggle = document.getElementById('beam-toggle');
const ufoImg = document.getElementById('ufo-img');
let spinDeg = 0;
beamToggle.addEventListener('click', () => {
  const dark = hero.classList.toggle('dark-mode');
  beamToggle.classList.toggle('on', dark);
  beamToggle.title = dark ? 'beam off' : 'beam on';
  spinDeg += 360;
  beamToggle.style.transform = `rotate(${spinDeg}deg)`;
});
ufoImg.addEventListener('click', () => beamToggle.click());

// ---------- spray trail behind the hero saucer ----------
const trailCanvas = document.getElementById('trail-canvas');
const trailCtx = trailCanvas.getContext('2d');
const ufoFly = document.getElementById('ufo-fly');
let trailPuffs = [];
let lastUfoPos = null;

// resizeCanvas / emit / paint come from common.js
resizeCanvas(trailCanvas, trailCtx);
window.addEventListener('resize', () => resizeCanvas(trailCanvas, trailCtx));

// A phone does not need 2200 radial-gradient fills a frame to sell a dust trail.
const TRAIL_MAX = CAN_HOVER ? 2200 : 300;

// The loop used to run for the life of the page, redrawing the hero long after
// it had been scrolled away. It now only runs while the hero is on screen.
let trailRaf = null;
function tick(t) {
  trailRaf = requestAnimationFrame(tick);
  const cr = trailCanvas.getBoundingClientRect();
  const ur = ufoImg.getBoundingClientRect();
  const p = { x: ur.left - cr.left + ur.width * 0.5, y: ur.top - cr.top + ur.height * 0.72 };
  emit(trailPuffs, p, lastUfoPos, t, 34, 0.22, '254,181,234');
  lastUfoPos = p;
  if (trailPuffs.length > TRAIL_MAX) trailPuffs.splice(0, trailPuffs.length - TRAIL_MAX);
  paint(trailCtx, trailCanvas, trailPuffs, t, 9000, 3200);
  trailPuffs = trailPuffs.filter(q => t - q.born <= 9000);
}
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) {
    if (trailRaf === null) { lastUfoPos = null; trailRaf = requestAnimationFrame(tick); }
  } else if (trailRaf !== null) {
    cancelAnimationFrame(trailRaf);
    trailRaf = null;
  }
}).observe(hero);
