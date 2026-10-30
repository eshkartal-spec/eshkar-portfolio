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
    // The page is a staircase you climb by scrolling (src/pages/StairsPage.jsx)
    layout: 'stairs',
    stairs: {
      // Full-screen opening: stairs with the title and summary already painted on their
      // bottom steps, a wide photo for landscape screens and a tall one for portrait
      // (phones). Each fills the screen and stays anchored on its bottom steps, so keep
      // the paint clear of the sides.
      opening: {
        wide: img('step-up-stairs', 'step-up-banner-3840px-copy', 'Concrete stairs close up, with STEP UP painted on the bottom step'),
        tall: img('step-up-stairs', 'step-up-mobile-1290x2796', 'Concrete stairs climbing toward the sky, with STEP UP painted on the bottom step'),
      },
      // Someone carrying the bike, seen from behind: climbs beside the stairs (desktop)
      climber: img('step-up-stairs', 'climber-back', 'Carrying the STEP UP bike up the stairs'),
      // The same stairs without the paint: the page's background, muted, behind the climb
      backdrop: '/images/step-up-stairs/banner-blank.webp',
    },
    title: 'STEP UP',
    fullTitle: 'STEP UP Bicycle',
    field: 'Product design',
    summary: 'A lightweight urban bicycle designed for stair carrying.',
    intro:
      'In the city, a bicycle is often carried up stairs and through narrow corridors, not only ridden. STEP UP is a lightweight urban bicycle designed to be easier to carry and maneuver, without compromising its everyday functionality.',
    type: 'Industrial design student project',
    year: 2025,
    duration: '3 months',
    tools: 'SolidWorks, BikeCAD, KeyShot, 3D printing, hand modeling, physical prototyping',
    cover: img('step-up', 'strap', 'STEP UP bicycle'),
    // Wide photo under the title on the project page (default: cover)
    banner: img('step-up', 'street', 'STEP UP in the city'),
    hero: img('step-up', 'three-quarter', 'STEP UP bicycle, studio shot'),
    heroAlt: img('step-up', 'carry', 'Eshkar carrying the STEP UP bike'),
    // Short line shown large, next to heroAlt
    pull: 'In the city, you often carry a bike up stairs, not only ride it.',
    // frame: the center of the feature on the climber photo of the stairs page, in % of
    // the photo as saved
    features: [
      {
        title: 'Ergonomic carrying handle',
        text: 'Positioned close to the bicycle’s center of mass for more balanced and comfortable lifting.',
        image: img('step-up', 'handle-close', 'The carrying handle set into the frame'),
        frame: { x: 57.5, y: 57.5 },
      },
      {
        title: 'Adjustable shoulder strap',
        text: 'Extends and retracts as needed, allowing the bicycle to be carried over the opposite shoulder.',
        image: img('step-up', 'strap-close', 'Pulling out the shoulder strap'),
        frame: { x: 35.5, y: 25 },
      },
      {
        title: 'Quick-release pedal',
        text: 'Can be repositioned during carrying to prevent interference with the rider’s leg.',
        image: img('step-up', 'pedal-close', 'The quick-release pedal mounted by the seat post'),
        frame: { x: 39, y: 46.5 },
      },
      {
        title: 'Folding handlebar',
        text: 'Reduces the bicycle’s width and enables smooth movement through narrow staircases.',
        image: img('step-up', 'bar-close', 'The folding handlebar'),
        frame: { x: 65, y: 33.5 },
      },
    ],
    gallery: [
      img('step-up', 'wheel', 'Wheel detail'),
      img('step-up', 'logo-frame', 'STEP UP logo on the frame'),
      img('step-up', 'carry-shoulder', 'Carrying STEP UP on the shoulder with the strap and handle'),
    ],
    process: [
      { label: 'Sketch', image: img('step-up', 'process-sketch', 'Early sketch: strap and handle placement') },
      { label: 'CAD', image: img('step-up', 'process-cad', 'BikeCAD sketch of the frame junction') },
      { label: 'Frame building', image: img('step-up', 'process-frame-jig', 'Aluminium frame tubes held in a laser-cut MDF jig') },
    ],
    // "More images": the panel the climb ends on, and the page it opens
    // (/projects/step-up/images), which ends with the process above. Left out as near
    // repeats: frame (of logo-frame) and strap (of strap-close).
    more: {
      cover: img('step-up', 'see-more', 'STEP UP in a dark studio'),
      sections: [
        {
          title: 'The bike',
          items: [
            img('step-up', 'three-quarter', 'STEP UP, three-quarter view'),
            img('step-up', 'side', 'STEP UP, side view'),
          ],
        },
        {
          title: 'In use',
          items: [
            img('step-up', 'street', 'STEP UP parked by city stairs'),
            img('step-up', 'carry', 'Carrying STEP UP up the stairs'),
            img('step-up', 'carry-shoulder', 'Carrying STEP UP on the shoulder with the strap and handle'),
          ],
        },
        {
          title: 'Details',
          items: [
            img('step-up', 'handle-close', 'The carrying handle set into the frame'),
            img('step-up', 'strap-close', 'Pulling out the shoulder strap'),
            img('step-up', 'bar-close', 'The folding handlebar'),
            img('step-up', 'pedal-close', 'The quick-release pedal mounted by the seat post'),
            img('step-up', 'logo-frame', 'STEP UP logo on the frame'),
            img('step-up', 'handle', 'The handle and the logo'),
            img('step-up', 'fork', 'The fork and front wheel'),
            img('step-up', 'wheel', 'Wheel detail'),
          ],
        },
      ],
    },
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
    year: null,
    duration: null,
    tools: null,
    cover: img('shrafraf', 'hero', 'Shrafraf'),
    hero: img('shrafraf', 'hero', 'Shrafraf'),
    features: [
      { title: 'Balance', text: null, image: null },
      { title: 'Textile straps', text: null, image: null },
      { title: 'Birch plywood', text: null, image: null },
    ],
    todo: ['One more sentence on the idea', 'Year, duration, tools', 'Text and photos for each feature', 'Detail and process photos'],
  },
  {
    slug: 'odds-or-evens',
    title: 'Odds or Evens',
    field: 'Personal project',
    summary: 'Personal design project exploring relationships through objects.',
    intro: 'A personal design project exploring relationships through objects.',
    type: 'Personal project',
    year: null,
    duration: null,
    tools: null,
    cover: img('odds-or-evens', 'group', 'Odds or Evens, the group of objects'),
    hero: img('odds-or-evens', 'group', 'Odds or Evens, the group of objects'),
    features: [
      { title: null, text: null, image: img('odds-or-evens', '1', 'Odds or Evens object') },
      { title: null, text: null, image: img('odds-or-evens', '2', 'Odds or Evens object') },
      { title: null, text: null, image: img('odds-or-evens', '3', 'Odds or Evens object') },
    ],
    todo: ['What the objects are and how they relate', 'Year, duration, tools', 'Name and text for each object', 'Detail and process photos'],
  },
  {
    slug: 'playstation',
    title: 'PlayStation',
    field: '3D modeling · Rendering',
    summary: '3D design of a PlayStation controller, modeled in SolidWorks and rendered in KeyShot.',
    intro: '3D design of a PlayStation controller, modeled in SolidWorks and rendered in KeyShot.',
    type: '3D modeling · Rendering',
    year: null,
    duration: null,
    tools: 'SolidWorks, KeyShot',
    cover: img('playstation', 'render-1', 'PlayStation controller render'),
    hero: img('playstation', 'render-1', 'PlayStation controller render'),
    features: [
      { title: 'Surfacing', text: null, image: img('playstation', 'render-2', 'PlayStation controller render') },
      { title: 'Details', text: null, image: img('playstation', 'render-3', 'PlayStation controller render') },
      { title: 'Rendering', text: null, image: img('playstation', 'render-4', 'PlayStation controller render') },
    ],
    todo: ['The goal of the exercise', 'Year, duration', 'Text for each feature', 'More renders and process'],
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
