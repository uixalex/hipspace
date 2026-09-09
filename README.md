# hip space — website export

Plain HTML/CSS/JS export of the "hip space" landing page (hero, about, services, work, about-me, FAQ, footer).

## Structure
```
index.html   – all markup
style.css    – all styling + keyframe animations
script.js    – interactions (accordions, project detail overlay, typewriter effect,
               scroll reveals, UFO flight/beam toggle, spray-trail cursor canvas)
assets/      – images (logo, saucer, alien, project photos, portrait, footer letters)
```

## Running it
No build step. Open `index.html` in a browser, or serve the folder with any static
server (e.g. `npx serve .` or VS Code's "Live Server" extension) so relative asset
paths resolve correctly.

## Notes for further dev in VS Code
- Colors and fonts are defined as CSS variables at the top of `style.css` (`--blue`,
  `--pink`, `--cream`, `--ink-2`). Fonts: Poppins (headings/body) + IBM Plex Mono
  (labels, descriptions, UI chrome), loaded from Google Fonts in `index.html`.
- Content for services, work projects and FAQs lives in arrays at the top of
  `script.js` (`SERVICES`, `PROJECTS`, `FAQS`) — edit those instead of the DOM.
- The footer logo is split into individual letter PNGs (`assets/L-*.png`) so each
  letter can tilt independently on hover — swap them out if you get vector source
  files for the real logo.
- `assets/alex-portrait.png` is a placeholder — drop in the real photo with the
  same filename, or update the `src` in `index.html` (`#alex .portrait-circle img`).
- The "beam on/off" button in the nav toggles a day/night easter egg on the hero
  (background + UFO beam brightness).
