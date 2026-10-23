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

- Text: `src/data/site.js` (about, contact, skills) and `src/data/projects.js` (projects)
- Photos: full-size originals go in `originals/<project>/` (not uploaded to GitHub),
  then `npm run images` makes web copies in `public/images/<project>/`
