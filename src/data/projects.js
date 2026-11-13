import { bazeletLogo } from './bazeletLogo'
// The Bazelet banner's drawing: a trail of tiles with the logo's pieces among them
// (originals/bazelet/Asset 1.svg)
import bazeletTrail from '../assets/bazelet-trail.svg?raw'

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
    year: 2026,
    context: 'Academic project',
    skills: 'SolidWorks, BikeCAD, KeyShot, 3D printing, hand modeling, physical prototyping',
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
    cover: img('step-up', 'intro', 'Lifting the STEP UP bike by its carrying strap'),
    // Full screen after the concept: carrying the bike up a flight of stairs, the line
    // along its bottom (PhotoLine.jsx; carry2-clean is carry2 with the corner mark painted
    // over)
    still: {
      ...img('step-up', 'carry2-clean', 'Carrying STEP UP up a flight of stone stairs by its handle'),
      line: 'In the city, you often carry a bike up stairs, not only ride it.',
    },
    // The bike's features, one at a time, the photo on one side and its words on the
    // other, turning over to the next as the page scrolls (FeatureFlip.jsx)
    flip: [
      {
        ...img('step-up', 'handle-close', 'The carrying handle set into the frame'),
        wide: true,
        note: {
          title: 'Ergonomic carrying handle',
          text: 'Positioned close to the bicycle’s center of mass for more balanced and comfortable lifting.',
        },
      },
      {
        ...img('step-up', 'strap-close', 'Pulling out the shoulder strap'),
        wide: true,
        note: {
          title: 'Adjustable shoulder strap',
          text: 'Extends and retracts as needed, allowing the bicycle to be carried over the opposite shoulder.',
        },
      },
      {
        ...img('step-up', 'pedal-close', 'The quick-release pedal mounted by the seat post'),
        note: {
          title: 'Quick-release pedal',
          text: 'Can be repositioned during carrying to prevent interference with the rider’s leg.',
        },
      },
      {
        ...img('step-up', 'bar-close', 'The folding handlebar'),
        wide: true,
        note: {
          title: 'Folding handlebar',
          text: 'Reduces the bicycle’s width and enables smooth movement through narrow staircases.',
        },
      },
    ],
    // The other studio photos round the rim of a turning bicycle wheel (WheelSpin.jsx),
    // each once (wide: a landscape photo). Left out as near repeats: v (of side), hrt-322
    // (of strap-close) and hrt-319 (of the other pedal shots); the hrt-306 to -310 and
    // hrt-318 copies are the same photos as three-quarter, fork, logo-frame, handle,
    // wheel and pedal-close
    wheel: [
      img('step-up', 'three-quarter', 'STEP UP, three-quarter view'),
      img('step-up', 'fork', 'The fork and front wheel'),
      { ...img('step-up', 'hrt-313', 'The grip and the STEP UP logo'), wide: true },
      img('step-up', 'side', 'STEP UP, side view'),
      img('step-up', 'hrt-317', 'The folding handlebar, from the front'),
      { ...img('step-up', 'hrt-312', 'The handlebar folded along the frame'), wide: true },
      img('step-up', 'wheel', 'Wheel detail'),
      { ...img('step-up', 'background-png', 'Carrying STEP UP by its handle in the studio'), ratio: 5288 / 6512 },
      img('step-up', 'hrt-333', 'The carrying handle, from below the frame'),
      img('step-up', 'hrt-314', 'STEP UP from the side'),
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
    // details (type, year, context, skills) along its bottom: a wide photo for landscape
    // screens and a tall one for portrait (phones)
    opening: {
      wide: img('my-chair', 'pipe-dream-banner', 'Pleated pink fabric with PIPE DREAM across it'),
      tall: img('my-chair', 'pipe-dream-mobile-1290x2796', 'Pleated pink fabric with PIPE DREAM across it'),
      // The pleats bend aside where the cursor passes, as if running your fingers
      // through them (PleatWarp.jsx)
      warp: true,
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
    year: 2026,
    context: 'Academic project',
    skills: 'Skill, skill, skill',
    cover: img('my-chair', 'seat', 'Pipe Dream'),
    hero: img('my-chair', 'seat', 'Pipe Dream'),
    // The materials, one at a time, the photo on one side and its words on the other,
    // swiping on to the next as the page scrolls (FeatureFlip.jsx, as Step Up's features);
    // the photos a little bigger than Step Up's (most of the screen's height)
    flipPhotoHeight: 0.88,
    flip: [
      {
        ...img('my-chair', 'hero', 'Pipe Dream, the whole chair'),
        note: { title: 'Rigid meets flexible', text: 'Rigid and flexible meet when someone sits in the chair.' },
      },
      {
        ...img('my-chair', 'detail2', 'The pleated textile over the frame'),
        note: {
          title: 'Pink textile',
          text: 'A pleated pink textile wraps over the pipes, bringing flexibility and organic flow to the frame.',
        },
      },
      {
        ...img('my-chair', 'detail', 'A threaded elbow and tee joining the pipes'),
        note: {
          title: 'Galvanized pipes',
          text: 'Galvanized steel pipes joined with threaded elbows and tees give the chair its geometric order and rigidity.',
        },
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
    type: 'Furniture design',
    // Placeholders until the real details come in
    year: 2026,
    context: 'Academic project',
    skills: 'Skill, skill, skill',
    // The concept, before the video (placeholder until the real text comes in)
    concept: 'A short paragraph about the idea behind Shrafraf will go here, once the text is ready.',
    // Full-screen banner: the piece nudged and rocking until it settles, played at each
    // click, under a grey veil with a pulsing dot until the first (BounceVideo.jsx; the
    // still is its last frame, at rest), with the title written large in white in the bottom left (name), it and the
    // details over a soft dark shade (light); on tall screens the clip is shown whole (its
    // shape: tallRatio), the details under it
    opening: {
      video: {
        src: '/images/shrafraf/shrafrafbounce.mp4',
        poster: '/images/shrafraf/shrafrafbounce.webp',
        alt: 'Shrafraf rocking from side to side and settling',
        // (its bottom softly blurred, about up to the details' line, hiding specks of lint
        // on the piece there)
        blurBottom: 0.17,
      },
      name: true,
      light: true,
      whole: true,
      tallRatio: '16 / 9',
    },
    cover: { ...img('shrafraf', 'hero', 'The Shrafraf stool'), contain: true },
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
    todo: ['Skills'],
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
      tallRatio: '16 / 9', // (its tall photo is 16:9 too)
    },
    summary: 'Personal design project exploring relationships through objects.',
    intro: 'A personal design project exploring relationships through objects.',
    // The intro is headed "Concept", and the page is laid out calm and centred
    introLabel: 'Concept',
    centered: true,
    type: 'Personal project',
    // Placeholders until the real details come in
    year: 2025,
    context: 'Academic project',
    skills: 'Skill, skill, skill',
    // A tall photo: the Home page's library shows it with the ring and the hands in view
    cover: img('odds-or-evens', 'intro', 'The white and brown halves of Odds or Evens: two triangles, a ring and two pyramids'),
    // The concept as on the other projects, centred; this photo under it, shown whole
    hero: img('odds-or-evens', 'concept', 'Bringing the white and brown halves of the triangle together'),
    // The three pairs, one section each: a name, a short explainer, and the two halves
    // to bring together (PairPlay.jsx; the photos trimmed to the object by
    // scripts/optimize-images.mjs). join: where the right half sits against the left when
    // joined; seam: how far along the left half its seam runs; pivot: the point the joined
    // pair turns around; all in the left photo's pixels. motion: what the joined pair
    // does, 'wobble' (rocks on its bottom point) or 'spin' (spins when flicked); or
    // 'repel': the halves never join, pushing each other away
    pairs: [
      {
        // Brown on the left, its photo mirrored so its long black edge faces right; the
        // white one on the right, its long black edge facing left: the two edges together
        // on the middle line (both turned so the edges stand straight, the brown one
        // scaled so they're the same length, in scripts/optimize-images.mjs)
        title: 'Triangle',
        text: 'A short explainer about this pair: what the two halves are, and what happens when they meet. Placeholder text for now.',
        left: img('odds-or-evens', 'browntriangle2', 'The brown half of the triangle'),
        right: img('odds-or-evens', 'whitetriangle2', 'The white half of the triangle'),
        mirror: 'left',
        join: [685, 0],
        seam: 697,
        pivot: [697, 1203],
        motion: 'wobble',
      },
      {
        // Brown on the left: its ends face right, the white one's face left; both turned a
        // touch so their ends stand straight, the white one scaled to the brown one's height
        // (scripts/optimize-images.mjs)
        title: 'Circle',
        text: 'A short explainer about this pair: what the two halves are, and what happens when they meet. Placeholder text for now.',
        left: img('odds-or-evens', 'brown-circle2', 'The brown half of the circle'),
        right: img('odds-or-evens', 'whitecircle2', 'The white half of the circle'),
        join: [638, 0],
        seam: 646,
        pivot: [635, 622],
        motion: 'spin',
      },
      {
        // Reverse magnets: they never join, always pushing each other away. Brown on the
        // left, turned upside down (scripts/optimize-images.mjs) so the short black lines
        // where they'd meet face each other; the middle line leaned to the black line's
        // angle (tilt)
        title: 'Pyramid',
        text: 'A short explainer about this pair: what the two halves are, and what happens when they meet. Placeholder text for now.',
        left: img('odds-or-evens', 'brownpyr', 'The brown half of the pyramid'),
        right: img('odds-or-evens', 'whitepyr', 'The white half of the pyramid'),
        tilt: -39,
        motion: 'repel',
      },
    ],
    todo: ['What the objects are and how they relate', 'Skills', 'Name and text for each pair'],
  },
  {
    // Renamed from PlayStation (it's an Xbox controller); its photos are still in the playstation folders
    slug: 'xbox',
    title: 'Xbox',
    field: '3D modeling · Rendering',
    summary: '3D design of an Xbox controller, modeled in SolidWorks and rendered in KeyShot.',
    intro: '3D design of an Xbox controller, modeled in SolidWorks and rendered in KeyShot.',
    type: '3D modeling · Rendering',
    year: 2025,
    context: 'Academic project',
    skills: 'SolidWorks, KeyShot',
    // Full-screen banner, in black and white with the title on it; where the cursor passes,
    // the color version shows through in square pixels (TextureReveal.jsx; with a mouse
    // only, over the wide banner)
    opening: {
      wide: img('playstation', 'xboxbanner', 'The Xbox controller in black and white, XBOX on its front in pink'),
      tall: img('playstation', 'xbox-mobile-1290x2796', 'The Xbox controller in black and white, XBOX on its front in pink'),
      texture: img('playstation', 'xboxbannercolor', ''),
      pixels: 24,
    },
    cover: { ...img('playstation', 'homepage', 'The Xbox controller on a pink desk'), position: '58% 50%' },
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
    todo: ['The goal of the exercise', 'The line over the video'],
  },
  {
    slug: 'bazelet',
    title: 'Bazelet footwear',
    field: 'Brand · Packaging',
    summary: 'Rebranding of the Israeli footwear brand Bazelet.',
    intro: 'Rebranding Bazelet, a handmade footwear brand, to reflect comfort, stability, and adventure.',
    type: 'Brand · Packaging',
    year: 2025,
    context: 'Academic project',
    skills: 'Skill, skill, skill',
    cover: img('bazelet', 'product-log', 'A pair of Bazelet sandals on a log by the water'),
    hero: null,
    // Full-screen banner: her drawing of a trail of tiles with the logo's pieces among
    // them, in fine outline (TrailBanner.jsx), the logo in the middle, above the title. The
    // logo's pieces rise and sink slowly as 3D buttons; a tile under the cursor fills with
    // the brand's blue; over the logo, all seven turn blue and settle, raised. The title
    // written over it, the details along the bottom.
    // (Earlier: a generated honeycomb with the logo hidden in it, pattern: { logo:
    // bazeletLogo, color } (HexPattern.jsx); and the photo banner, bazeletbanner /
    // bazeletbannermobile, with specsSide, focus '0% 100%', tallRatio '2161 / 3840',
    // blurTop and footprints, steps: true)
    opening: {
      trail: {
        art: bazeletTrail,
        color: '#5f8797',
        // (tried and taken out: the trail photo under it, mirrored and turned so its dirt
        // path ran under the tiles: photo: { src: '/images/bazelet/trail.webp', size:
        // [2400, 1800], at: [1300, 1150], to: [780, 720], scale: 1, angle: -31, mirror: true })
      },
      name: true,
      // with a mouse, a few soft grey sandal prints follow the cursor, fading quickly
      steps: { life: 1.1, dark: 0.16, stride: 150, ink: '70,72,76', edge: '40,42,46' },
    },
    // After the concept: the four fields side by side in a sliding strip, the one shown
    // filling most of the section and the next peeking in at the right (FieldSwipe.jsx)
    fields: [
      {
        title: 'Logo',
        text: "The mark joins a turtle's shell, a home carried everywhere, with the landscape this handmade brand comes from, evoking stability, movement and comfort.",
        image: img('bazelet', 'bazeletmarble-clean', 'The Bazelet logo cut into a marble sign'),
      },
      {
        title: 'Branding',
        text: 'Together, the logo and color palette ground the brand, giving its message and story one clear, steady voice.',
        image: img('bazelet', 'branding2', 'Bazelet cards on a stone block'),
      },
      {
        title: 'Packaging',
        text: 'Shaped by the rolling hills of the north, the packaging hints at the adventures the shoes will take you on.',
        image: img('bazelet', 'basalt-inspired-hebrew-packaging-mockup', 'The Bazelet shoebox on a stone pedestal'),
      },
      {
        title: 'Product',
        text: 'Made for walking in comfort: as steady as the rock formations, as free as the northern landscape.',
        image: img('bazelet', 'product-log', 'A pair of Bazelet sandals on a log by the water'),
      },
    ],
    // NOT SHOWN for now (kept to be used somewhere else): the interactive logo, its seven
    // pieces full screen (PieceLogo.jsx; the outline from originals/bazelet/logo.svg). The
    // four biggest each stand for a topic (piece: its place in the logo's list): with the
    // cursor over one, its photo shows through it, and clicking it opens it big in the
    // middle of the screen, with its words. To show it again, rename this back to logo.
    logoPieces: {
      shape: bazeletLogo,
      topics: [
        {
          piece: 4,
          title: 'Branding',
          text: "Together, the logo and color palette ground the brand, giving its message and story one clear, steady voice.",
          image: img('bazelet', 'branding2', 'Bazelet cards on a stone block'),
          // (cursor: the photo trailing the mouse over the opened window, if not the
          // piece's own; behind: a photo filling the screen behind the window)
          cursor: img('bazelet', 'branding-1', 'The Bazelet box, sleeve, card and a sandal'),
          behind: img('bazelet', 'branding2', 'Bazelet cards on a stone block'),
        },
        {
          piece: 5,
          title: 'Packaging',
          text: "Shaped by the rolling hills of the north, the packaging hints at the adventures the shoes will take you on.",
          image: img('bazelet', 'basalt-inspired-hebrew-packaging-mockup', 'The Bazelet shoebox on a stone pedestal'),
          cursor: img('bazelet', 'basalt-shoebox-in-neutral-elegance', 'Holding the Bazelet shoebox'),
          behind: img('bazelet', 'basalt-inspired-hebrew-packaging-mockup', 'The Bazelet shoebox on a stone pedestal'),
        },
        {
          piece: 6,
          title: 'Product',
          text: "Made for walking in comfort: as steady as the rock formations, as free as the northern landscape.",
          image: img('bazelet', 'terracotta-woven-sandals-on-stone-pedestal', 'A pair of terracotta woven Bazelet sandals on a stone pedestal'),
          cursor: img('bazelet', 'product-stone', 'A pair of Bazelet sandals on a stone among leaves'),
          behind: img('bazelet', 'product-log', 'A pair of Bazelet sandals on a log by the water'),
        },
        {
          piece: 2,
          title: 'Logo',
          text: "The mark joins a turtle's shell, a home carried everywhere, with the landscape this handmade brand comes from, evoking stability, movement and comfort.",
          // (logo2-mark: logo2.jpg widened with its own paper to fit the wide piece, its word
          // painted out, the mark only)
          image: img('bazelet', 'logo2-mark', 'The Bazelet mark cut into paper'),
          cursor: img('bazelet', 'logo2', 'The Bazelet logo cut into paper'),
          // (square: its photo turned to lie square on the piece, its bottom along the short
          // face beside the name, as if printed on it)
          square: true,

          behind: img('bazelet', 'bazeletmarble-clean', 'The Bazelet logo cut into a marble sign'),
        },
      ],
      // The three other pieces each set the section's background to a scene from nature,
      // until another is chosen or it's clicked again
      backgrounds: [
        { piece: 0, title: 'Basalt', image: img('bazelet', 'basalt-3', 'Hexagonal basalt columns') },
        { piece: 1, title: 'Turtle', image: img('bazelet', 'turtle', 'A tortoise shell, close up') },
        { piece: 3, title: 'Path', image: img('bazelet', 'path', 'A dirt path through the grass at sunset') },
      ],
    },
    todo: ['What changed and why', 'Skills', 'Detail and process photos'],
  },
]

export const getProject = (slug) => projects.find((p) => p.slug === slug)
