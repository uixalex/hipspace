// ---------- project data ----------
// Loaded before case-study.js, which builds the case study page from it.
// The v2 pages bring their own nav, footer and motion (v2.js), so this file
// only carries the projects and the few labels the case study needs.

// ---------- language ----------
// The Serbian pages live in sr/ and load these same scripts from one folder up;
// <html lang> says which copy to use and how far away the assets are.
const LANG = document.documentElement.lang === 'sr' ? 'sr' : 'en';
const ROOT = LANG === 'sr' ? '../' : '';
const T = {
  en: { visit: 'Visit site', caseStudyTitle: 'Case study', image: 'project image', view: 'View' },
  sr: { visit: 'Pogledaj sajt', caseStudyTitle: 'Projekat', image: 'slika projekta', view: 'Pogledaj' }
}[LANG];

// Work rows link straight to `site` (the live project) for now. `src` is the
// hover peek image — a project without one simply shows no peek card, so adding
// the file later is enough to bring it back.
// `hero`, `gallery` and `body` feed case-study.html; a project with
// `caseStudy: true` links there instead of to its live site. A gallery entry is a
// path, or { src, wide: true } for a full-width image (the first one always is).
// `scope` lists what was done; without it the case study splits up `meta`.
// `story` is the longer write-up under the intro: rows of { label, text } or
// { label, list } for a row of points.
const PROJECTS = [
  { n: "01", name: "MOKE",          meta: "Visual Identity & Web Design", src: "assets/moke-cover.webp",      site: "https://mokeinternational.com/",
    caseStudy: true, hero: "assets/moke-cover.jpg",
    scope: ["Visual identity system", "Art direction", "UX & user journey", "Web design", "Responsive design"],
    gallery: [
      "assets/moke-01-mood.jpg",
      { src: "assets/moke-03-accents.jpg", wide: true },
      { src: "assets/moke-04-pages.jpg", wide: true },
      { src: "assets/moke-21-blur.jpg", wide: true },
      { src: "assets/moke-12-riviera.jpg", wide: true },
      { src: "assets/moke-09-frames.jpg", wide: true },
      { src: "assets/moke-05-pages.jpg", wide: true }
    ],
    body: "MOKE International launched the Electric MOKE, a beach-car icon reborn as a premium electric vehicle. We brought its regional websites together under one visual identity, where lifestyle photography sets the mood and the path from first look to pre-order stays short.",
    story: [
      { label: "The challenge", text: "MOKE International launched the Electric MOKE but ran multiple regional websites with inconsistent visual identities. The fragmented brand presence was diluting its premium positioning and putting pre-order momentum at risk." },
      { label: "The approach", text: "We rooted the design in the Electric MOKE's core identity: open-air freedom, coastal living, effortless exploration. An editorial colour palette, aspirational typography and a layout structure let lifestyle photography carry the emotional weight before a single spec is read." },
      { label: "Key decisions", list: [
        "Unified every regional touchpoint under one consistent visual system, ending the brand fragmentation.",
        "Structured the user journey around discover, understand, configure and pre-order, to reduce friction at checkout.",
        "Designed a responsive system that performs consistently across desktop, tablet and mobile.",
        "Delivered launch-ready, in time to carry campaign traffic and pre-order activity from day one."
      ] }
    ] },
  { n: "04", name: "Rello",         meta: "Product, Web & Visual Identity", src: "assets/rello.webp",         site: "https://rello.co.uk/",
    caseStudy: true, hero: "assets/rello-phone.jpg",
    scope: ["Product strategy", "UX research & flows", "Web platform UI", "Mobile app UI", "Design system", "Visual identity", "Marketing website"],
    gallery: [
      "assets/rello-app-icon.png",
      "assets/rello-home-screen.jpg",
      { src: "assets/case-rello-website.webp", wide: true },
      { src: "assets/rello-color.png", wide: true },
      { src: "assets/rello-dashboard.jpg", wide: true },
      { src: "assets/rello-desktop-screens.jpg", wide: true },
      { src: "assets/rello-app-screens.jpg", wide: true },
      { src: "assets/case-rello-social.jpg", wide: true }
    ],
    body: "Rello takes the stress out of buying and selling a home in the UK. We designed the product from the ground up: a web platform and a mobile app that let estate agents, lawyers and their clients follow the whole property chain in one place, with a status colour for every stage, so anyone can see at a glance who is ready to exchange. Around it we built the visual identity, from the house-shaped e of the logo to the navy and teal palette, and the marketing website that brings it all together.",
    story: [
      { label: "The challenge", text: "Rello needed to simplify a property buying and selling process spread across multiple steps, documents and stakeholders. Existing platforms lacked clarity and structure, which made the process hard to understand and easy to abandon." },
      { label: "The approach", text: "We grounded the design in a deep understanding of the business model, the service flow and the specific anxieties users face at each step. We mapped the key user journeys to find where confusion was most likely, then explored several layout and hierarchy directions before settling on a structure that balances information density with visual clarity." },
      { label: "Key decisions", list: [
        "Applied a single visual language across web and app, ending the split-platform confusion clients faced before.",
        "Simplified a multi-step process into a clearer, more manageable structure.",
        "Built a bold palette of navy, teal, yellow, coral and mint with clean typography, to earn trust as a credible alternative to legacy property platforms.",
        "Designed components for consistent reuse across every touchpoint, from the marketing site to the deepest in-app screens."
      ] }
    ] },
  { n: "09", name: "Awaken180°",    meta: "Product Design & Mobile App", src: "assets/project-awaken180.webp",
    caseStudy: true,
    scope: ["UX research & user journeys", "Information architecture", "Mobile app UI", "Design system", "Prototyping"],
    gallery: [
      "assets/awaken-onboarding.jpg",
      { src: "assets/case-awaken180-screen3.png", wide: true },
      { src: "assets/awaken-daily.jpg", wide: true },
      { src: "assets/case-awaken180-screen1.webp", wide: true },
      { src: "assets/awaken-content.jpg", wide: true }
    ],
    body: "Awaken180° Weightloss is a coaching programme with a proven in-person method. We redesigned its mobile app from the ground up around a daily habit loop, so clients can log meals, track their progress and stay motivated between sessions.",
    story: [
      { label: "The challenge", text: "Awaken180° already had a mobile app, but it was outdated and limited to the bare minimum. Clients had no real way to track progress, log meals or stay engaged between in-person sessions. The gap between the programme's proven in-person method and its digital experience was hurting consistency and motivation." },
      { label: "The approach", text: "We mapped the full user journey to pinpoint where the existing app was failing clients: clunky onboarding, no way to see real progress, nothing to keep people engaged day to day. Then we rebuilt the information architecture around a daily habit loop and expanded the feature set well beyond what the old app offered." },
      { label: "Key decisions", list: [
        "Redesigned onboarding to get users to their first action in under two minutes.",
        "Added food scanning, a recipe library, and water, sleep and mood tracking, none of which existed in the original app.",
        "Brought guided workout videos into the app instead of sending clients elsewhere.",
        "Built a results dashboard so clients see their full progress at a glance, with milestone moments that keep motivation up once a goal is hit.",
        "Kept the home screen to the core daily actions only, so the experience stays focused instead of overwhelming."
      ] }
    ] },
  { n: "02", name: "Moving Portal", meta: "Visual Identity & Web Design", src: "assets/moving-portal.webp", site: "https://themovingportal.co.uk/",
    caseStudy: true,
    scope: ["Logo design", "Visual identity", "Brand guidelines", "Web design", "UX & site structure"],
    gallery: [
      "assets/moving-portal-logo.png",
      { src: "assets/movingportal-color.png", wide: true },
      { src: "assets/moving-portal-website.jpg", wide: true },
      { src: "assets/moving-portal-rensponsive.jpg", wide: true }
    ],
    body: "The Moving Portal connects home buyers with RICS chartered surveyors across England, Wales and Northern Ireland. They came to us with no logo, no identity and no website, and left with a complete brand and a website that walks visitors from their first question to an enquiry.",
    story: [
      { label: "The challenge", text: "The Moving Portal was starting completely from scratch, with no logo, no visual identity and no website. In a competitive property market, it needed to look credible and trustworthy from day one, with no existing brand equity to lean on." },
      { label: "The approach", text: "We built the brand around three values: professionalism, clarity and approachability. Property buyers are making major financial decisions, so the identity had to feel confident and reassuring without turning cold or corporate. The website reads as a clear narrative, what is this, how does it work, why trust it, how do I start, so every section answers the question a visitor is actually asking at that point." },
      { label: "Key decisions", list: [
        "Designed the logo to work in every context, from a website header to a business card to a digital document.",
        "Chose a clean green palette to signal trust and forward movement, paired with a typography system built for readability across all touchpoints.",
        "Documented a complete brand system, with colour, type, logo variations and spacing, so it scales consistently as the business grows.",
        "Structured the site to guide visitors from awareness straight through to enquiry, keeping the next step obvious at every stage."
      ] }
    ] },
  { n: "03", name: "Bytek",         meta: "Branding & Web Design", src: "assets/bytek.webp",         site: "https://bytek.ba/",               gallery: [], body: "" },
  { n: "05", name: "OOEJ",          meta: "Web Design", src: "assets/ooej.webp",          site: "https://ooej.org/",               gallery: [], body: "" },
  { n: "06", name: "RAWR",          meta: "Web Design", src: "assets/rawr.webp",          site: "https://rawr-fawn.vercel.app/",   gallery: [], body: "" },
  { n: "07", name: "Rubedo",        meta: "Web Design", src: "assets/rubedo.webp",        site: "https://www.rubedolife.com/",     gallery: [], body: "" },
  { n: "08", name: "Quackables",    meta: "Branding & Web Design", src: "assets/quackables-mockup.webp", site: "https://quackables.vercel.app/",  gallery: [], body: "" }
];

// The Serbian copy, by project number; anything left out stays as above.
const PROJECTS_SR = {
  "01": { meta: "Vizuelni identitet i web dizajn",
    scope: ["Sistem vizuelnog identiteta", "Art direkcija", "UX i put korisnika", "Web dizajn", "Responzivni dizajn"],
    body: "MOKE International je lansirao Electric MOKE, ikonu među autima za plažu, obnovljenu kao premium električno vozilo. Regionalne sajtove smo objedinili pod jednim vizuelnim identitetom, u kojem lifestyle fotografija postavlja atmosferu, a put od prvog pogleda do prednarudžbine ostaje kratak.",
    story: [
      { label: "Izazov", text: "MOKE International je lansirao Electric MOKE, ali je imao više regionalnih sajtova sa neusklađenim vizuelnim identitetima. Rascepkano prisustvo brenda slabilo je njegovu premium poziciju i ugrožavalo zamah prednarudžbina." },
      { label: "Pristup", text: "Dizajn smo zasnovali na suštini Electric MOKE-a: sloboda na otvorenom, život uz obalu, opušteno istraživanje. Urednička paleta boja, aspirativna tipografija i struktura stranica puštaju lifestyle fotografiju da nosi emociju pre nego što se pročita ijedna tehnička specifikacija." },
      { label: "Ključne odluke", list: [
        "Sve regionalne kanale smo objedinili pod jednim doslednim vizuelnim sistemom i tako okončali rascepkanost brenda.",
        "Put korisnika smo složili u četiri koraka, otkrij, upoznaj, konfiguriši i naruči unapred, da bi kupovina tekla bez zastoja.",
        "Dizajnirali smo responzivni sistem koji jednako dobro radi na desktopu, tabletu i mobilnom.",
        "Sajt je bio spreman na vreme da od prvog dana podnese saobraćaj iz kampanje i prednarudžbine."
      ] }
    ] },
  "02": { meta: "Vizuelni identitet i web dizajn",
    scope: ["Dizajn logotipa", "Vizuelni identitet", "Brend smernice", "Web dizajn", "UX i struktura sajta"],
    body: "The Moving Portal povezuje kupce nekretnina sa RICS ovlašćenim procenjivačima širom Engleske, Velsa i Severne Irske. Došli su kod nas bez logotipa, identiteta i sajta, a otišli sa kompletnim brendom i sajtom koji posetioca vodi od prvog pitanja do upita.",
    story: [
      { label: "Izazov", text: "The Moving Portal je kretao potpuno od nule, bez logotipa, vizuelnog identiteta i sajta. Na konkurentnom tržištu nekretnina morao je od prvog dana da deluje kredibilno i pouzdano, bez ikakvog ugleda brenda na koji bi se oslonio." },
      { label: "Pristup", text: "Brend smo izgradili oko tri vrednosti: profesionalnost, jasnoća i pristupačnost. Kupci nekretnina donose velike finansijske odluke, pa je identitet morao da uliva sigurnost i poverenje, a da ne postane hladan ili korporativan. Sajt je složen kao jasna priča, šta je ovo, kako radi, zašto mu verovati, kako da počnem, tako da svaka sekcija odgovara na pitanje koje posetilac u tom trenutku zaista postavlja." },
      { label: "Ključne odluke", list: [
        "Logo smo dizajnirali da radi u svakom kontekstu, od zaglavlja sajta do vizit karte i digitalnog dokumenta.",
        "Izabrali smo čistu zelenu paletu koja govori o poverenju i kretanju napred, uz tipografski sistem napravljen za čitljivost na svim mestima gde se brend pojavljuje.",
        "Dokumentovali smo kompletan brend sistem, boje, tipografiju, varijacije logotipa i razmake, da bi ostao dosledan kako firma raste.",
        "Sajt smo složili tako da posetioca vodi od prvog upoznavanja pravo do upita, a sledeći korak je u svakoj fazi očigledan."
      ] }
    ] },
  "09": { meta: "Dizajn proizvoda i mobilna aplikacija",
    scope: ["UX istraživanje i korisnički tokovi", "Informaciona arhitektura", "UI mobilne aplikacije", "Dizajn sistem", "Prototip"],
    body: "Awaken180° Weightloss je program mršavljenja sa proverenom metodom rada uživo. Njihovu mobilnu aplikaciju smo redizajnirali od nule oko dnevne rutine, tako da klijenti beleže obroke, prate napredak i ostaju motivisani između susreta sa trenerom.",
    story: [
      { label: "Izazov", text: "Awaken180° je već imao mobilnu aplikaciju, ali zastarelu i svedenu na najosnovnije. Klijenti nisu imali pravi način da prate napredak, beleže obroke ili ostanu uključeni između susreta uživo. Jaz između proverene metode rada uživo i digitalnog iskustva kvario je doslednost i motivaciju." },
      { label: "Pristup", text: "Mapirali smo ceo put korisnika da tačno vidimo gde postojeća aplikacija izneverava klijente: nezgrapan onboarding, nikakav uvid u stvarni napredak, ništa što ljude drži uključenim iz dana u dan. Zatim smo informacionu arhitekturu izgradili iznova oko dnevne rutine i proširili funkcije daleko preko onoga što je stara aplikacija nudila." },
      { label: "Ključne odluke", list: [
        "Onboarding smo redizajnirali tako da korisnik do prve akcije stigne za manje od dva minuta.",
        "Dodali smo skeniranje hrane, biblioteku recepata i praćenje vode, sna i raspoloženja, ništa od toga nije postojalo u staroj aplikaciji.",
        "Video treninge smo doneli u samu aplikaciju, umesto da klijente šaljemo negde drugde.",
        "Napravili smo pregled rezultata u kojem klijenti na prvi pogled vide ceo svoj napredak, sa trenucima proslave koji drže motivaciju i kad se cilj dostigne.",
        "Početni ekran prikazuje samo ključne dnevne zadatke, da iskustvo ostane fokusirano, a ne da zatrpava."
      ] }
    ] },
  "03": { meta: "Brending i web dizajn" },
  "04": { meta: "Proizvod, web i vizuelni identitet",
    scope: ["Strategija proizvoda", "UX istraživanje i tokovi", "UI web platforme", "UI mobilne aplikacije", "Dizajn sistem", "Vizuelni identitet", "Marketinški sajt"],
    body: "Rello skida stres sa kupovine i prodaje nekretnina u Velikoj Britaniji. Proizvod smo dizajnirali od nule: web platformu i mobilnu aplikaciju u kojima agenti za nekretnine, advokati i njihovi klijenti prate ceo lanac kupoprodaje na jednom mestu, sa bojom statusa za svaku fazu, tako da svako na prvi pogled vidi ko je spreman za potpisivanje. Oko toga smo izgradili vizuelni identitet, od slova e u obliku kuće u logotipu do teget i tirkizne palete, i marketinški sajt koji sve to povezuje.",
    story: [
      { label: "Izazov", text: "Rello je trebalo da pojednostavi kupovinu i prodaju nekretnina, proces razvučen kroz mnogo koraka, dokumenata i učesnika. Postojećim platformama nedostajali su jasnoća i struktura, pa je proces bio težak za razumevanje i lako se odustajalo od njega." },
      { label: "Pristup", text: "Dizajn smo zasnovali na dubokom razumevanju poslovnog modela, toka usluge i konkretnih briga koje korisnici imaju u svakom koraku. Mapirali smo ključne korisničke tokove da nađemo gde je zabuna najverovatnija, a zatim istražili više pravaca rasporeda i hijerarhije pre nego što smo se odlučili za strukturu koja usklađuje količinu informacija sa vizuelnom jasnoćom." },
      { label: "Ključne odluke", list: [
        "Jedan vizuelni jezik smo dosledno primenili na web i aplikaciju i tako uklonili zabunu koju su klijenti ranije imali zbog razdvojenih platformi.",
        "Proces od mnogo koraka smo pretvorili u jasniju strukturu kojom se lakše upravlja.",
        "Napravili smo odvažnu paletu, teget, tirkiznu, žutu, koralnu i mint, uz čistu tipografiju, da bi Rello ulivao poverenje kao ozbiljna alternativa starim platformama za nekretnine.",
        "Komponente smo dizajnirali za doslednu ponovnu upotrebu na svakom mestu, od marketinškog sajta do najdubljih ekrana u aplikaciji."
      ] }
    ] },
  "05": { meta: "Web dizajn" },
  "06": { meta: "Web dizajn" },
  "07": { meta: "Web dizajn" },
  "08": { meta: "Brending i web dizajn" }
};
if (LANG === 'sr') PROJECTS.forEach(p => Object.assign(p, PROJECTS_SR[p.n]));
// the image paths above are written from the site root
PROJECTS.forEach(p => {
  if (p.src) p.src = ROOT + p.src;
  if (p.hero) p.hero = ROOT + p.hero;
  p.gallery = p.gallery.map(g => typeof g === 'string' ? ROOT + g : { ...g, src: ROOT + g.src });
});

// ---------- language switch ----------
// a case study keeps its ?p= so the other language lands on the same project
document.querySelectorAll('.nav-lang').forEach(a => { a.href += location.search; });
