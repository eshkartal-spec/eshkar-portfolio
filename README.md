# Eshkar Karish portfolio

React + Vite + React Router, set up the same way as Sagi's portfolio.

## Branches

- `main`: the new site (work in progress)
- `v1-live`: the old site, exactly as it was live on eshkar-site.vercel.app

Each branch has its own `vercel.json`, so Vercel knows how to publish whichever one is chosen.

## Working on it

```
npm install
npm run dev       # local preview
npm run build     # the files Vercel publishes, in dist/
```

## Before publishing

- [ ] Add her Instagram link: `contact.instagram` in `src/data/site.js`
      (`npm run build` warns while it's missing)
- [ ] Optional: move the resume PDF off the old Wix site into `public/`

## Content

Text lives in `src/data/site.js` (about, contact, skills) and `src/data/projects.js` (projects).

### Where photos go

```
originals/              <- PUT PHOTOS HERE: full size, any file name. Stays on this
  step-up/                 computer (not uploaded to GitHub).
  my-chair/
  shrafraf/
  odds-or-evens/
  playstation/
  bazelet/
  about/                <- photos of Eshkar herself
  hero/                 <- the (hidden) full-screen photo section

public/images/          <- web-sized copies, made from originals/ by `npm run images`.
                           Don't edit or add here by hand.
src/assets/             <- logos (SVG): logo.svg is the one the intro uses
```

To add photos: drop them into the project's folder in `originals/`, then run
`npm run images` (or ask Claude, who will also name and place them).
