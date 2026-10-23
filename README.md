# Eshkar Karish portfolio — v1 (live version)

This branch is the portfolio exactly as it was live on eshkar-site.vercel.app,
made in Claude's design tool, with the photos shrunk for the web.

It is plain files with no build step: `index.html` loads `support.js`, which
loads React from unpkg.com and draws the page. `vercel.json` tells Vercel to
publish the files as they are.

The new site is built on the `main` branch.
