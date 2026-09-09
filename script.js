// ---------- data ----------
const SERVICES = [
  { phase: "Be seen from orbit", title: "Branding & visual identity", body: "From brand strategy and positioning to logos, visual systems, packaging and print, we build brands that feel distinctive, recognisable and memorable." },
  { phase: "Broadcast the signal", title: "Social & campaign design", body: "A clear visual direction for social content, campaigns and launches that keeps your brand looking like itself everywhere." },
  { phase: "Build the spacecraft", title: "Web design", body: "Responsive websites that bring your brand to life and make it easy for people to understand, trust and choose you." }
];

// PROJECTS lives in common.js: the case study page reads it too.

const FAQS = [
  { q: "What does a project with hip space cost?", a: "A full identity starts around €6k and a brand-plus-website engagement around €12k. Every quote is fixed and itemised after the first call, so you know the number before anything begins, with no hourly surprises." },
  { q: "How long does it take?", a: "Identity work runs four to six weeks. Identity plus a website runs eight to twelve. We hold two projects at a time so yours never sits in a queue." },
  { q: "What do you need from me to start?", a: "Whatever exists today: old logos, decks, a competitor you admire, plus one decision-maker who can give feedback in a single voice. We handle the rest, including the questions you haven't thought of yet." },
  { q: "Do you only do branding, or the website too?", a: "Both, and they work best together: strategy, identity, then a site built on that identity. If you already have a brand you love, we're happy to design and build only the site." },
  { q: "Who actually builds the website?", a: "We do. Design and build sit in the same studio, so nothing is lost in a handover, and you get a site your team can update without calling a developer." },
  { q: "What if I don't like the first direction?", a: "You'll see two directions, not twenty, each with the reasoning behind it. Two revision rounds are built into every stage, and because strategy is agreed before design, the direction is rarely a surprise." },
  { q: "Will my brand be too weird for my market?", a: "Distinct isn't reckless. We pressure-test every direction against your audience and your competitors: the goal is to be remembered by the right people, not loud for its own sake." },
  { q: "What happens after launch?", a: "You get the full file set, brand guidelines and a walkthrough for your team. We stay on call for launch week, and many clients keep us on a light monthly retainer for new campaigns." }
];

// CAN_HOVER comes from common.js

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
buildStars(document.querySelector('.stars-far'), 90, 1, 1.6, true);
buildStars(document.querySelector('.stars-near'), 45, 1.6, 2.6, false);
buildStars(document.querySelector('.stars-alex'), 70, 1, 1.8, true);
buildStars(document.querySelector('.stars-about'), 60, 1, 1.8, true);
buildStars(document.querySelector('.stars-cta'), 50, 1, 1.8, true);

// ---------- build services ----------
const servicesList = document.getElementById('services-list');
SERVICES.forEach((s, i) => {
  const row = document.createElement('div');
  row.className = 'service-row';
  row.innerHTML = `
    <div class="service-head">
      <span class="service-n mono">${String(i + 1).padStart(2, '0')}</span>
      <div class="service-title-wrap"><h3>${s.title}</h3></div>
    </div>
    <div class="alien-peek">
      <div class="speech-bubble">${s.phase}</div>
      <img src="assets/alien.png" alt="" />
    </div>
    <div class="service-body-wrap"><div class="service-body-inner"><p>${s.body}</p></div></div>
  `;
  const toggle = () => {
    const willOpen = !row.classList.contains('open');
    document.querySelectorAll('.service-row.open').forEach(r => r !== row && r.classList.remove('open'));
    row.classList.toggle('open', willOpen);
  };
  row.addEventListener('click', toggle);
  if (CAN_HOVER) {
    row.addEventListener('mouseenter', () => row.classList.add('open'));
    row.addEventListener('mouseleave', () => row.classList.remove('open'));
  }
  servicesList.appendChild(row);
});

// ---------- build work list ----------
// buildWorkRows + the peek parallax live in common.js: the case study reuses them
buildWorkRows(document.getElementById('work-list'), PROJECTS);

// ---------- build FAQ ----------
const faqList = document.getElementById('faq-list');
FAQS.forEach((f, i) => {
  const item = document.createElement('div');
  item.className = 'faq-item';
  item.innerHTML = `
    <div class="faq-q">
      <span class="faq-n">${String(i + 1).padStart(2, '0')}</span>
      <h3>${f.q}</h3>
      <span class="faq-toggle">+</span>
    </div>
    <div class="faq-a-wrap"><div class="faq-a-inner"><p>${f.a}</p></div></div>
  `;
  const q = item.querySelector(".faq-q");
  const open = (willOpen) => item.classList.toggle("open", willOpen);
  q.addEventListener('click', () => open(!item.classList.contains('open')));
  if (CAN_HOVER) {
    item.addEventListener('mouseenter', () => open(true));
    item.addEventListener('mouseleave', () => open(false));
  }
  faqList.appendChild(item);
});

// ---------- scroll reveal ----------
// the generic .reveal observer lives in common.js; this is the home-only part.
// About-me content enters as one calm sequence: heading, text, then CTA.
const alexSection = document.getElementById('alex');
const alexIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    alexIo.unobserve(e.target);
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

function tick(t) {
  requestAnimationFrame(tick);
  const cr = trailCanvas.getBoundingClientRect();
  const ur = ufoImg.getBoundingClientRect();
  const p = { x: ur.left - cr.left + ur.width * 0.5, y: ur.top - cr.top + ur.height * 0.72 };
  emit(trailPuffs, p, lastUfoPos, t, 34, 0.22, '254,181,234');
  lastUfoPos = p;
  if (trailPuffs.length > 2200) trailPuffs.splice(0, trailPuffs.length - 2200);
  paint(trailCtx, trailCanvas, trailPuffs, t, 9000, 3200);
  trailPuffs = trailPuffs.filter(q => t - q.born <= 9000);
}
requestAnimationFrame(tick);
