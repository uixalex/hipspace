// ---------- case study page ----------
// Same layout for every project; the content comes from PROJECTS (common.js),
// picked by the ?p= number in the URL, e.g. case-study.html?p=02

const requested = new URLSearchParams(location.search).get('p');
// unknown or missing ?p falls back to the first project rather than a blank page
const project = PROJECTS.find(p => p.n === requested) || PROJECTS[0];

document.title = `${project.name} — hip space`;
document.getElementById('detail-name-sr').textContent = project.name;
document.getElementById('detail-name').textContent = project.name;
document.getElementById('detail-desc').textContent = project.body;
document.getElementById('detail-site').href = project.site;
// a project with no artwork yet keeps the plain pink hero rather than url('')
const heroImg = project.hero || project.src;
if (heroImg) document.getElementById('detail-image').style.backgroundImage = `url('${heroImg}')`;

const gallery = document.getElementById('detail-gallery');
gallery.innerHTML = project.gallery.map((image, index) => `
  <figure class="detail-gallery-item${index === 0 ? ' detail-gallery-item-wide' : ''}">
    <img src="${image}" alt="${project.name} project image ${index + 1}" />
  </figure>
`).join('');

// the remaining projects, shown as work rows so the section matches the
// work list on the home page
buildWorkRows(document.getElementById('detail-related-list'),
              PROJECTS.filter(p => p !== project).slice(0, 2));
