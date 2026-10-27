// ---------- case study page ----------
// Same layout for every project; the content comes from PROJECTS (common.js),
// picked by the ?p= number in the URL, e.g. case-study.html?p=02

const requested = new URLSearchParams(location.search).get('p');
// unknown or missing ?p falls back to the first project rather than a blank page
const project = PROJECTS.find(p => p.n === requested) || PROJECTS[0];

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
document.getElementById('detail-name').textContent = project.name;
document.getElementById('detail-desc').textContent = project.body;
// an app with no public site has no link to show
const siteLink = document.getElementById('detail-site');
if (project.site) siteLink.href = project.site; else siteLink.remove();
// what was done: the project's own scope list, or its kind of work split up
const scope = project.scope || project.meta.split(/\s*(?:&|,)\s*/);
document.getElementById('detail-scope').innerHTML = scope.map(s => `<li>${s}</li>`).join('');
// a project with no artwork yet keeps the plain cover colour rather than url('')
const heroImg = project.hero || project.src;
// the cover shows once the picture has loaded, so no half-drawn image or empty
// box flashes first
if (heroImg) {
  const cover = document.getElementById('detail-image');
  cover.style.setProperty('--cover', `url('${heroImg}')`);
  const img = new Image();
  img.onload = img.onerror = () => cover.classList.add('is-loaded');
  img.src = heroImg;
}

// the longer write-up, a numbered row per part; a project without one shows nothing
document.getElementById('detail-story').innerHTML = (project.story || []).map((row, i) => `
  <div class="cs-story-row">
    <h2 class="cs-story-label"><span>${String(i + 1).padStart(2, '0')}</span>${row.label}</h2>
    ${row.list
      ? `<ul class="cs-story-list">${row.list.map(item => `<li>${item}</li>`).join('')}</ul>`
      : `<p class="cs-story-text">${row.text}</p>`}
  </div>`).join('');

const gallery = document.getElementById('detail-gallery');
gallery.innerHTML = project.gallery.map((image, index) => {
  const { src, wide } = typeof image === 'string' ? { src: image } : image;
  return `
  <figure class="detail-gallery-item${index === 0 || wide ? ' detail-gallery-item-wide' : ''}">
    <img src="${src}" alt="${project.name}, ${T.image} ${index + 1}" loading="${index ? 'lazy' : 'eager'}" decoding="async" />
  </figure>`;
}).join('');

// the next three projects in the list, wrapping round at the end
const at = PROJECTS.indexOf(project);
buildProjectCards(document.getElementById('detail-related-list'),
                  [1, 2, 3].map(k => PROJECTS[(at + k) % PROJECTS.length]));
