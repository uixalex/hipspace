// ---------- case study page ----------
// Same layout for every project; the content comes from PROJECTS (common.js),
// picked by the ?p= number in the URL, e.g. case-study.html?p=02

const requested = new URLSearchParams(location.search).get('p');
// unknown or missing ?p falls back to the first project rather than a blank page
const project = PROJECTS.find(p => p.n === requested) || PROJECTS[0];

document.title = `${project.name} — hip space`;
document.getElementById('detail-name').textContent = project.name;
document.getElementById('detail-desc').textContent = project.body;
document.getElementById('detail-site').href = project.site;
// what was done: the project's own scope list, or its kind of work split up
const scope = project.scope || project.meta.split(/s*(?:&|,)s*/);
document.getElementById('detail-scope').innerHTML = scope.map(s => `<li>${s}</li>`).join('');
// a project with no artwork yet keeps the plain cover colour rather than url('')
const heroImg = project.hero || project.src;
if (heroImg) document.getElementById('detail-image').style.backgroundImage = `url('${heroImg}')`;

const gallery = document.getElementById('detail-gallery');
gallery.innerHTML = project.gallery.map((image, index) => {
  const { src, wide } = typeof image === 'string' ? { src: image } : image;
  return `
  <figure class="detail-gallery-item${index === 0 || wide ? ' detail-gallery-item-wide' : ''}">
    <img src="${src}" alt="${project.name} project image ${index + 1}" loading="${index ? 'lazy' : 'eager'}" decoding="async" />
  </figure>`;
}).join('');

// the next three projects in the list, wrapping round at the end
const at = PROJECTS.indexOf(project);
buildProjectCards(document.getElementById('detail-related-list'),
                  [1, 2, 3].map(k => PROJECTS[(at + k) % PROJECTS.length]));
