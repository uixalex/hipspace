// ---------- case study page ----------
// Same layout for every project; the content comes from PROJECTS (common.js),
// picked by the ?p= number in the URL, e.g. case-study.html?p=02. It runs
// before v2.js, so the titles and cards are in place when the motion starts.

const requested = new URLSearchParams(location.search).get('p');
// unknown or missing ?p falls back to the first project rather than a blank page
const project = PROJECTS.find(p => p.n === requested) || PROJECTS[0];
const $id = id => document.getElementById(id);

// to search engines every case study is a page of its own: its own title,
// description, canonical and language pair. A ?p without a written case study
// (or no ?p at all) shows the fallback project, which stays out of the index.
document.title = `${project.name} – ${T.caseStudyTitle} | Hipspace`;
const pageUrl = lang => `https://www.hipspacestudio.com/${lang === 'sr' ? 'sr/' : ''}case-study.html?p=${project.n}`;
const addToHead = (tag, attrs) => document.head.appendChild(Object.assign(document.createElement(tag), attrs));
if (project.caseStudy && project.n === requested) {
  // the body cut to a search-snippet length, at a word boundary
  const summary = project.body.length > 155 ? project.body.slice(0, 155).replace(/\s+\S*$/, '') + '…' : project.body;
  addToHead('meta', { name: 'description', content: summary });
  addToHead('link', { rel: 'canonical', href: pageUrl(LANG) });
  addToHead('link', { rel: 'alternate', hreflang: 'en', href: pageUrl('en') });
  addToHead('link', { rel: 'alternate', hreflang: 'sr', href: pageUrl('sr') });
  addToHead('link', { rel: 'alternate', hreflang: 'x-default', href: pageUrl('en') });
} else {
  addToHead('meta', { name: 'robots', content: 'noindex, follow' });
}

// ---- under the cover: the name and the kind of work ----
$id('cs-name').textContent = project.name;
$id('cs-meta').textContent = project.meta;

// ---- cover ----
const cover = project.hero || project.src;
if (cover) $id('cs-cover').innerHTML = `<img src="${cover}" alt="${project.name}" decoding="async" />`;
else $id('cs-cover').remove();

// ---- the live link and what was done, right under the cover ----
// an app with no public site has no link to show
const siteLink = $id('cs-site');
if (project.site) siteLink.href = project.site; else siteLink.remove();
const scope = project.scope || project.meta.split(/\s*(?:&|,)\s*/);
$id('cs-scope').innerHTML = scope.map(s => `<li>${s}</li>`).join('');
$id('cs-body').textContent = project.body;

// ---- pictures and story, in turn ----
// The pictures are cut into even groups with a part of the story (challenge,
// approach, decisions) after each, so the text comes in small doses on the
// way down instead of one long block before any picture.
const story = project.story || [];
const shots = (project.gallery || []).map((g, i) => ({ ...(typeof g === 'string' ? { src: g } : g), n: i + 1 }));
const groups = Array.from({ length: story.length + 1 }, () => []);
const per = Math.ceil(shots.length / groups.length) || 1;
shots.forEach((s, i) => groups[Math.min(Math.floor(i / per), groups.length - 1)].push(s));

// wide pictures take the full row, the rest pair up; a picture left without a
// partner goes full width too, so a group never shows an empty half
function shotsHtml(list) {
  let run = [];
  const closeRun = () => { if (run.length % 2) run[run.length - 1].wide = true; run = []; };
  list.forEach(g => { if (g.wide) closeRun(); else run.push(g); });
  closeRun();
  return `<div class="cs-shots">${list.map(({ src, wide, n }) => `
    <figure class="cs-shot${wide ? ' cs-shot-wide' : ''}" data-fade>
      <img src="${src}" alt="${project.name}, ${T.image} ${n}" loading="lazy" decoding="async" />
    </figure>`).join('')}</div>`;
}
const storyHtml = (row, i) => `
  <div class="cs-part" data-fade>
    <h2 class="cs-part-title"><span class="cs-n">${String(i + 1).padStart(2, '0')}</span>${row.label}</h2>
    ${row.list
      ? `<ul class="cs-points">${row.list.map(item => `<li>${item}</li>`).join('')}</ul>`
      : `<p class="cs-part-text">${row.text}</p>`}
  </div>`;
$id('cs-flow').innerHTML = groups.map((g, i) =>
  (g.length ? shotsHtml(g) : '') + (story[i] ? storyHtml(story[i], i) : '')).join('');

// ---- more work: two other written case studies, as the work page's cards ----
// the two that come after this one in the list, wrapping round, so every page suggests different ones
const studies = PROJECTS.filter(p => p.caseStudy);
const at = studies.indexOf(project);
const others = studies.filter(p => p !== project)
  .sort((a, b) => (studies.indexOf(a) - at + studies.length) % studies.length - (studies.indexOf(b) - at + studies.length) % studies.length)
  .slice(0, 2);
$id('cs-more-grid').innerHTML = others.map(p => {
  const shots = [p.hero || p.src, ...p.gallery.map(g => typeof g === 'string' ? g : g.src)].filter(Boolean);
  return `<a href="case-study.html?p=${p.n}" class="proj" data-gallery="${shots.join(', ')}">
    <div class="proj-media"><img src="${shots[0]}" alt="${p.name}" loading="lazy" /></div>
    <div class="proj-meta"><h3>${p.name}</h3><span>${p.meta}</span></div>
  </a>`;
}).join('');
