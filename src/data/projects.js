// All projects, in the order they appear. Text and photos carried over from v1.
//
// Images: drop full-size photos into originals/<project>/, run `npm run images`,
// then use the web copy from public/images/<project>/ (same name, .webp).
//
// null = not written yet. `todo` lists what v1 marked as missing.

const img = (project, name, alt) => ({ src: `/images/${project}/${name}.webp`, alt })

export const projects = [
  {
    slug: 'step-up',
    title: 'STEP UP',
    fullTitle: 'STEP UP Bicycle',
    field: 'Product design',
    summary: 'A lightweight urban bicycle designed for stair carrying.',
    // Under the banner, calm and centred: the line that was painted on the banner's
    // second step
    introLabel: 'Concept',
    intro: 'A lightweight urban bicycle designed for stair carrying.',
    centered: true,
    hero: null,
    // The longer version, not on the page for now
    about:
      'In the city, a bicycle is often carried up stairs and through narrow corridors, not only ridden. STEP UP is a lightweight urban bicycle designed to be easier to carry and maneuver, without compromising its everyday functionality.',
    type: 'Industrial design student project',
    year: 2025,
    duration: '3 months',
    tools: 'SolidWorks, BikeCAD, KeyShot, 3D printing, hand modeling, physical prototyping',
    // Full-screen banner: stairs with the title painted on their bottom step (the "clean"
    // copies have the line that was on the second step painted over), a wide photo for
    // landscape screens and a tall one for portrait (phones). The details run along its
    // top (specsTop), clear of the title; on tall screens the photo is shown whole, the
    // details under it
    opening: {
      wide: img('step-up-stairs', 'step-up-banner-3840px-clean', 'Concrete stairs close up, with STEP UP painted on the bottom step'),
      tall: img('step-up-stairs', 'step-up-mobile-1290x2796-clean', 'Concrete stairs climbing toward the sky, with STEP UP painted on the bottom step'),
      whole: true,
      specsTop: true,
      // The painted title cut out of each photo, letter by letter (white where the paint
      // is, made from the clean photos at their web size: <wide>-1.png to -6.png), for the
      // letters' colors to change in turn; and the tall photo's shape
      paint: { wide: '/images/step-up-stairs/step-up-paint-wide', tall: '/images/step-up-stairs/step-up-paint-tall', letters: 6 },
      tallRatio: '1290 / 2796',
      // A grain over the photo, for an urban, raw-concrete feel
      grit: true,
    },
    cover: img('step-up', 'strap', 'STEP UP bicycle'),
    // A flight of stairs climbed by scrolling, in a window, with someone carrying the bike
    // on it (StairsClimb.jsx): how many steps, the line above the window, the climber (seen
    // from behind) and the same stairs as the banner without the paint, shown muted behind
    climb: {
      steps: 14,
      line: 'In the city, you often carry a bike up stairs, not only ride it.',
      climber: img('step-up-stairs', 'climber-back', 'Carrying the STEP UP bike up the stairs'),
      backdrop: '/images/step-up-stairs/banner-blank.webp',
    },
    // The studio photos, as a wall (BrickWall.jsx), each once (wide: a landscape photo);
    // clicking one opens them all in a gallery that turns like a wheel (WheelGallery.jsx).
    // The bike's features are highlighted, with their words (note). Left out as near
    // repeats: v (of side), hrt-322 (of strap-close) and hrt-319 (of the other pedal
    // shots); the hrt-306 to -310 and hrt-318 copies are the same photos as three-quarter,
    // fork, logo-frame, handle, wheel and pedal-close
    wall: [
      img('step-up', 'three-quarter', 'STEP UP, three-quarter view'),
      {
        ...img('step-up', 'handle-close', 'The carrying handle set into the frame'),
        wide: true,
        note: {
          title: 'Ergonomic carrying handle',
          text: 'Positioned close to the bicycle’s center of mass for more balanced and comfortable lifting.',
        },
      },
      { ...img('step-up', 'hrt-311', 'The saddle'), wide: true },
      img('step-up', 'fork', 'The fork and front wheel'),
      { ...img('step-up', 'hrt-313', 'The grip and the STEP UP logo'), wide: true },
      img('step-up', 'side', 'STEP UP, side view'),
      {
        ...img('step-up', 'strap-close', 'Pulling out the shoulder strap'),
        wide: true,
        note: {
          title: 'Adjustable shoulder strap',
          text: 'Extends and retracts as needed, allowing the bicycle to be carried over the opposite shoulder.',
        },
      },
      img('step-up', 'hrt-317', 'The folding handlebar, from the front'),
      img('step-up', 'logo-frame', 'STEP UP logo on the frame'),
      { ...img('step-up', 'hrt-312', 'The handlebar folded along the frame'), wide: true },
      {
        ...img('step-up', 'pedal-close', 'The quick-release pedal mounted by the seat post'),
        note: {
          title: 'Quick-release pedal',
          text: 'Can be repositioned during carrying to prevent interference with the rider’s leg.',
        },
      },
      img('step-up', 'wheel', 'Wheel detail'),
      // (ratio: a shape of its own, width / height)
      { ...img('step-up', 'background-png', 'Carrying STEP UP by its handle in the studio'), ratio: 5288 / 6512 },
      img('step-up', 'hrt-333', 'The carrying handle, from below the frame'),
      img('step-up', 'hrt-314', 'STEP UP from the side'),
      {
        ...img('step-up', 'bar-close', 'The folding handlebar'),
        wide: true,
        note: {
          title: 'Folding handlebar',
          text: 'Reduces the bicycle’s width and enables smooth movement through narrow staircases.',
        },
      },
      img('step-up', 'handle', 'The handle and the logo'),
      { ...img('step-up', 'hrt-323', 'Pulling the strap out of the frame'), wide: true },
      img('step-up', 'hrt-320', 'The pedal clipped beside the seat post'),
      { ...img('step-up', 'hrt-315', 'Folding the handlebar'), wide: true },
      img('step-up', 'carry-shoulder', 'Carrying STEP UP on the shoulder with the strap and handle'),
    ],
  },
  {
    slug: 'pipe-dream',
    title: 'Pipe Dream',
    field: 'Furniture',
    // The page's background: the cool grey of the studio photos, with soft pleats
    backdrop: { color: '#e4e7e4', pleats: true },
    // Full-screen photo at the top of the page, with the title already on it and the
    // details (type, year, duration, tools) along its bottom: a wide photo for landscape
    // screens and a tall one for portrait (phones)
    opening: {
      wide: img('my-chair', 'pipe-dream-banner', 'Pleated pink fabric with PIPE DREAM across it'),
      tall: img('my-chair', 'pipe-dream-mobile-1290x2796', 'Pleated pink fabric with PIPE DREAM across it'),
      // The pleats bend aside where the cursor passes, as if running your fingers
      // through them (PleatWarp.jsx)
      warp: true,
      // The fabric's pink: the photo fades into it at the bottom, and the video under it
      // comes out of it
      fade: '#e3b6a1',
    },
    // A video played by scrolling, with the summary over it
    scrub: { src: '/images/my-chair/pipe-video.mp4', poster: '/images/my-chair/pipe-video.webp' },
    // Two full-screen photos taking turns
    swap: [
      img('my-chair', 'seated-studio-wide-3840x2160', 'Sitting in Pipe Dream, legs crossed'),
      img('my-chair', 'reclining-studio-wide-3840x2160', 'Lying back over Pipe Dream, upside down'),
    ],
    summary:
      'A chair exploring the meeting point between flexibility and rigidity, geometric order and organic flow.',
    intro:
      'A chair exploring the meeting point between flexibility and rigidity, geometric order and organic flow.',
    type: 'Furniture design',
    // Placeholders until the real details come in
    year: '20XX',
    duration: 'X weeks',
    tools: 'Tool, tool, tool',
    cover: img('my-chair', 'seat', 'Pipe Dream'),
    hero: img('my-chair', 'seat', 'Pipe Dream'),
    // The materials: three photos in a row, each with its words in a tooltip that
    // follows the cursor over it (on touch screens, under it)
    details: [
      {
        image: img('my-chair', 'hero', 'Pipe Dream, the whole chair'),
        title: 'Rigid meets flexible',
        text: 'Rigid and flexible meet when someone sits in the chair.',
      },
      {
        image: img('my-chair', 'detail2', 'The pleated textile over the frame'),
        title: 'Pink textile',
        text: 'A pleated pink textile wraps over the pipes, bringing flexibility and organic flow to the frame.',
      },
      {
        image: img('my-chair', 'detail', 'A threaded elbow and tee joining the pipes'),
        title: 'Galvanized pipes',
        text: 'Galvanized steel pipes joined with threaded elbows and tees give the chair its geometric order and rigidity.',
      },
    ],
  },
  {
    slug: 'shrafraf',
    title: 'Shrafraf',
    field: 'Object',
    summary: 'Who Holds Whom? An Exercise in Balance.',
    intro:
      'Who Holds Whom? An exercise in balance between two birch plywood pieces held together by textile straps.',
    type: 'Object design',
    // Placeholders until the real details come in
    year: '20XX',
    duration: 'X weeks',
    tools: 'Tool, tool, tool',
    // Full-screen banner: the piece nudged and rocking until it settles, played once on
    // arrival and again at each click (BounceVideo.jsx; the still is its last frame, at
    // rest), with the title written large in white in the bottom left (name), it and the
    // details over a soft dark shade (light); on tall screens the clip is shown whole (its
    // shape: tallRatio), the details under it
    opening: {
      video: {
        src: '/images/shrafraf/shrafrafbounce.mp4',
        poster: '/images/shrafraf/shrafrafbounce.webp',
        alt: 'Shrafraf rocking from side to side and settling',
      },
      name: true,
      light: true,
      whole: true,
      tallRatio: '16 / 9',
    },
    cover: img('shrafraf', 'hero', 'Shrafraf'),
    // The assembly, sped up (scripts/optimize-images.mjs), playing on a loop while it's on
    // screen, with the idea over it: its lead as the title, the rest under it, smaller
    scrub: { src: '/images/shrafraf/shrafraf.mp4', poster: '/images/shrafraf/shrafraf.webp', loop: true },
    scrubLead: 'Who holds whom?',
    scrubText: 'An exercise in balance between two birch plywood pieces held together by textile straps.',
    // Then the rendering and the photos, in one frame, slid along to the side one by one
    // by scrolling (PhotoSlide.jsx; ratio: their shape, width / height; the frame takes the
    // first one's)
    photos: [
      { ...img('shrafraf', 'petite-sculptural-stool-in-sunlit-living-room', 'Shrafraf in a sunlit living room, a blanket over it (rendering)'), ratio: 1447 / 1087 },
      { ...img('shrafraf', 'gemini-generated-image-s9mut5s9mut5s9mu', 'Shrafraf, its white plywood held by olive straps'), ratio: 1194 / 896 },
      { ...img('shrafraf', 'gemini-generated-image-fepmc5fepmc5fepm', 'Shrafraf from above: the straps across the frame'), ratio: 1194 / 896 },
      { ...img('shrafraf', 'gemini-generated-image-xginx4xginx4xgin', 'Shrafraf from the side, its two pieces crossing'), ratio: 1195 / 896 },
    ],
    todo: ['Year, duration, tools'],
  },
  {
    slug: 'odds-or-evens',
    title: 'Odds or Evens',
    field: 'Personal project',
    // Full-screen photo at the top of the page, with the title already on it and the
    // details along its bottom: on wide screens the pieces spread out, clear of the
    // details; on tall ones a centred version, shown whole (whole: true) with the
    // details under it, as filling the screen would cut the title's sides
    opening: {
      wide: img('odds-or-evens', 'oddsbanner2', 'The Odds or Evens pieces with ODDS OR EVENS across them'),
      tall: img('odds-or-evens', 'oddsbanner', 'The Odds or Evens pieces with ODDS OR EVENS across them'),
      whole: true,
      // Where the cursor passes, a leather-textured version of the wide photo shows through
      // (TextureReveal.jsx; with a mouse only). Instead, ripples: true makes the photo
      // ripple softly like water (RippleWarp.jsx)
      texture: img('odds-or-evens', 'oddstex2', ''),
    },
    summary: 'Personal design project exploring relationships through objects.',
    intro: 'A personal design project exploring relationships through objects.',
    // The intro is headed "Concept", and the page is laid out calm and centred
    introLabel: 'Concept',
    centered: true,
    type: 'Personal project',
    // Placeholders until the real details come in
    year: '20XX',
    duration: 'X weeks',
    tools: 'Tool, tool, tool',
    // A tall photo: the Home page's library shows it with the ring and the hands in view
    cover: { ...img('odds-or-evens', 'main', 'Fitting the halves of Odds or Evens together'), position: '50% 35%' },
    // A full-screen photo with the concept written over it, in its empty top-left
    // corner (introOnPhoto); on phones the concept sits above the photo instead
    hero: img('odds-or-evens', 'concept', 'Bringing the white and brown halves of the triangle together'),
    introOnPhoto: true,
    // The three pairs, one section each: a name, a short explainer, and the two halves
    // to bring together (white on the left, brown on the right; PairPlay.jsx). The
    // photos are placeholders for now. join: where the right half sits against the left
    // when joined; seam: how far along the left half its seam runs; pivot: the point the
    // joined pair turns around; all in the left photo's pixels. motion: what the joined
    // pair does, 'wobble' (rocks on its bottom point) or 'spin' (spins when flicked)
    pairs: [
      {
        title: 'Triangle',
        text: 'A short explainer about this pair: what the two halves are, and what happens when they meet. Placeholder text for now.',
        left: img('odds-or-evens', 'trianglewhite', 'The white half of the triangle'),
        right: img('odds-or-evens', 'trianglebrown', 'The brown half of the triangle'),
        join: [162, -2],
        seam: 212,
        pivot: [185, 305],
        motion: 'wobble',
      },
      {
        title: 'Circle',
        text: 'A short explainer about this pair: what the two halves are, and what happens when they meet. Placeholder text for now.',
        left: img('odds-or-evens', 'circlewhite', 'The white half of the circle'),
        right: img('odds-or-evens', 'circlebrown', 'The brown half of the circle'),
        join: [172, 9],
        seam: 181,
        pivot: [184, 152],
        motion: 'spin',
      },
      {
        title: 'Third pair',
        text: 'A short explainer about this pair: what the two halves are, and what happens when they meet. Placeholder text for now.',
      },
    ],
    todo: ['What the objects are and how they relate', 'Year, duration, tools', 'Name and text for each pair', 'Photos of the third pair, and final photos of the first two'],
  },
  {
    // Renamed from PlayStation (it's an Xbox controller); its photos are still in the playstation folders
    slug: 'xbox',
    title: 'Xbox',
    field: '3D modeling · Rendering',
    summary: '3D design of an Xbox controller, modeled in SolidWorks and rendered in KeyShot.',
    intro: '3D design of an Xbox controller, modeled in SolidWorks and rendered in KeyShot.',
    type: '3D modeling · Rendering',
    year: null,
    duration: null,
    tools: 'SolidWorks, KeyShot',
    // Full-screen banner, in black and white with the title on it; where the cursor passes,
    // the color version shows through in square pixels (TextureReveal.jsx; with a mouse
    // only, over the wide banner)
    opening: {
      wide: img('playstation', 'xboxbanner', 'The Xbox controller in black and white, XBOX on its front in pink'),
      tall: img('playstation', 'xbox-mobile-1290x2796', 'The Xbox controller in black and white, XBOX on its front in pink'),
      texture: img('playstation', 'xboxbannercolor', ''),
      pixels: 24,
    },
    cover: img('playstation', 'render-1', 'Xbox controller render'),
    // The sped-up modeling video, playing on a loop while it's on screen (cut to the
    // modeling area and sped up twice over in scripts/optimize-images.mjs), with these
    // words over it
    scrub: { src: '/images/playstation/video.mp4', poster: '/images/playstation/video.webp', loop: true },
    scrubText: 'Modeled surface by surface in SolidWorks, from the first sketch to the finished controller.',
    // Then the model itself (ModelStage.jsx), facing the front: drag to turn it, slide the
    // line between render and CAD. It can also carry notes on its details (notes: [{ title,
    // text, at }], at: a point on the surface in the model's own units, meters)
    model: {
      src: '/images/playstation/part2.glb',
      label: 'The Xbox controller in 3D',
      fallback: img('playstation', 'render-1', 'Xbox controller render'),
    },
    todo: ['The goal of the exercise', 'Year, duration', 'The line over the video'],
  },
  {
    slug: 'bazelet',
    title: 'Bazelet footwear',
    field: 'Brand · Packaging',
    summary: 'Rebranding of the Israeli footwear brand Bazelet.',
    intro: 'Rebranding of the Israeli footwear brand Bazelet.',
    type: 'Brand · Packaging',
    year: null,
    duration: null,
    tools: null,
    cover: img('bazelet', 'outdoor', 'Bazelet sandals outdoors'),
    hero: img('bazelet', 'outdoor', 'Bazelet sandals outdoors'),
    features: [
      { title: 'Packaging', text: null, image: img('bazelet', 'box', 'Bazelet packaging') },
      { title: 'Product', text: null, image: img('bazelet', 'sandal', 'Bazelet sandal') },
      { title: 'Visual identity', text: null, image: img('bazelet', 'collage', 'Bazelet brand collage') },
    ],
    todo: ['What changed and why', 'Year, duration, tools', 'Text for each feature', 'Detail and process photos'],
  },
]

export const getProject = (slug) => projects.find((p) => p.slug === slug)
