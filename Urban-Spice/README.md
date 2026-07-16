# Urban Spice — Restaurant Website

A premium, production-quality marketing website for **Urban Spice**, a modern
urban-fusion restaurant. Built as a fast, dependency-light static site that a
real restaurant client could deploy today.

**Live Demo:** deploy via GitHub Pages (see [Installation](#installation)) — once published, your URL will look like `https://<your-username>.github.io/Urban-Spice/`

---

## Project Overview

Urban Spice needed a site that felt as considered as the food: warm, editorial,
a little bit theatrical, and unmistakably not a template. The result is a
single-page experience (plus a matching 404 page) covering the full guest
journey — discover the story, browse the menu, see the room, read reviews,
and book a table — with every interaction built by hand in vanilla JavaScript.

**Design language:** charcoal & ivory surfaces, a saffron-gold accent, and a
deep-paprika secondary color, paired with an editorial serif (Fraunces) for
headlines, a clean grotesque (Manrope) for body copy, and a monospace
(JetBrains Mono) used deliberately for menu prices and labels — styled like a
kitchen order ticket. That "ticket" treatment (dotted leader between dish name
and price) is the site's signature detail.

---

## Features

**Structure**
- Sticky, glassmorphic navigation with active-link underline animation and a responsive mobile menu
- Full-height hero with parallax-style zoom background, floating spice-dust particles, and a scroll indicator
- About section with story, mission, and animated statistic counters
- Filterable special-menu grid ("chef's ticket" cards: image, badges, description, dotted-leader price)
- Icon-based "Why Choose Us" feature grid
- Interactive gallery with hover reveal + custom lightbox (no external lightbox library)
- Auto-rotating testimonial slider with star ratings and manual controls
- Fully validated reservation form (name, phone, email, date, time, guests)
- Contact section with address, phone, email, hours, embedded Google Map, and a WhatsApp deep link
- Footer with quick links, social icons, and a newsletter signup
- Custom-branded 404 page

**Experience / polish**
- Dark / light mode toggle (persisted via `localStorage`, respects system preference on first visit)
- Scroll progress bar
- Animated on-scroll counters
- Lightweight, dependency-free scroll-reveal engine (`IntersectionObserver`-based — an AOS-style effect implemented natively for performance, so the page ships zero extra animation libraries)
- Branded loading screen
- Back-to-top, floating WhatsApp, and floating call buttons
- Smooth scrolling and hover micro-interactions throughout
- Custom cursor on desktop (disabled automatically on touch devices)
- Lazy-loaded images
- Fully responsive mobile-first layout (phone / tablet / desktop)
- SEO meta tags, Open Graph + Twitter Card tags, canonical URL, and JSON-LD `Restaurant` structured data
- Accessible: semantic landmarks, ARIA labels on icon-only controls, visible focus states, skip-to-content link, `prefers-reduced-motion` support

---

## Technologies Used

- **HTML5** — semantic markup
- **Tailwind CSS** (via CDN, JIT config inline) — utility layout & responsive breakpoints
- **Custom CSS** (`css/style.css`, `css/responsive.css`) — design tokens, glassmorphism, animations, and the signature menu-ticket component that Tailwind utilities alone don't express well
- **Vanilla JavaScript (ES6)** (`js/script.js`) — all interactivity, no jQuery, no frameworks
- Google Fonts: Fraunces, Manrope, JetBrains Mono

No build step, no bundler, no npm dependencies — open `index.html` and it runs.

---

## Project Structure

```
Urban-Spice/
│── index.html          # Full one-page site (all sections live here, linked by nav anchors)
│── 404.html             # Custom error page
│── css/
│     style.css          # Design tokens, components, animations
│     responsive.css      # Fine-grained breakpoint tweaks & print styles
│── js/
│     script.js          # All interactivity (nav, theme, counters, slider, lightbox, form validation, cursor…)
│── images/               # Local image assets (site currently uses hosted stock photography — see note below)
│── assets/
│     favicon.svg
│── README.md
```

> **Note on imagery:** all photography in this build is sourced from Unsplash
> as production-ready placeholders. Before going live, swap the `<img src>`
> values (and the hero background) in `index.html` for the restaurant's own
> photography — the `images/` folder is ready to hold them.

---

## Installation

**Run locally**

```bash
git clone https://github.com/<your-username>/Urban-Spice.git
cd Urban-Spice
# then just open index.html in a browser, or serve it:
python3 -m http.server 8000
# visit http://localhost:8000
```

**Deploy on GitHub Pages**

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment," set **Source** to `Deploy from a branch`, branch `main`, folder `/root`.
4. Save — your site will publish at `https://<your-username>.github.io/<repo-name>/`.

---

## Screenshots

_Add screenshots of the live site here once deployed, e.g.:_

```
![Hero section](screenshots/hero.png)
![Menu section](screenshots/menu.png)
![Gallery + lightbox](screenshots/gallery.png)
![Dark mode](screenshots/dark-mode.png)
```

---

## Customization Quick Reference

| What | Where |
|---|---|
| Colors / fonts | `tailwind.config` script block in `index.html`, and `:root` in `css/style.css` |
| Menu items | `#menu` section in `index.html` (each dish is a `.ticket-card` article) |
| Reservation logic / validation rules | `validators` object in `js/script.js` |
| Contact details / map | `#contact` section in `index.html` |
| WhatsApp number | `href="https://wa.me/…"` links (nav CTA, contact section, floating button) |

---

© Urban Spice. Built for a modern, spice-forward dining experience.
