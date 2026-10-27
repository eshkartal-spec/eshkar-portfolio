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
      // Full-screen opening photo. If its steps already have the title and details
      // printed on them, set `painted: true` and leave out `risers`. Otherwise the site
      // paints them on: `risers` are the fronts of its bottom steps, in the photo's own
      // pixels (x, y = top-left; w, h = size), bottom step first.
      photo: {
        src: '/images/step-up-stairs/stairs-photo.webp',
        alt: 'Concrete stairs climbing between trees',
        painted: false,
        width: 736,
        height: 1104,
        risers: [
          { x: 112, y: 999, w: 560, h: 101 },
          { x: 108, y: 906, w: 470, h: 84 },
          { x: 106, y: 836, w: 440, h: 62 },
          { x: 106, y: 772, w: 420, h: 56 },
        ],
      },
      // Someone carrying the bike, seen from behind: climbs beside the stairs (desktop)
      climber: img('step-up-stairs', 'climber-back', 'Carrying the STEP UP bike up the stairs'),
      // Seamless texture for the 3D stairs
      texture: '/images/step-up-stairs/concrete.webp',
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
    pull: 'In the city, a bicycle is often carried up stairs, not only ridden.',
    features: [
      {
        title: 'Ergonomic carrying handle',
        text: 'Positioned close to the bicycle’s center of mass for more balanced and comfortable lifting.',
        image: img('step-up', 'handle-close', 'The carrying handle set into the frame'),
      },
      {
        title: 'Adjustable shoulder strap',
        text: 'Extends and retracts as needed, allowing the bicycle to be carried over the opposite shoulder.',
        image: img('step-up', 'strap-close', 'Pulling out the shoulder strap'),
      },
      {
        title: 'Quick-release pedal',
        text: 'Can be repositioned during carrying to prevent interference with the rider’s leg.',
        image: img('step-up', 'pedal-close', 'The quick-release pedal mounted by the seat post'),
      },
      {
        title: 'Folding handlebar',
        text: 'Reduces the bicycle’s width and enables smooth movement through narrow staircases without catching on railings or disturbing other users.',
        image: img('step-up', 'bar-close', 'The folding handlebar'),
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
    // Photos in originals/step-up that v1 didn't use: fork, frame, handle, side
  },
  {
    slug: 'my-chair',
    title: 'My Chair',
    field: 'Furniture',
    summary:
      'A chair exploring the meeting point between flexibility and rigidity, geometric order and organic flow.',
    intro:
      'A chair exploring the meeting point between flexibility and rigidity, geometric order and organic flow.',
    type: 'Furniture design',
    year: null,
    duration: null,
    tools: null,
    cover: img('my-chair', 'seat', 'My Chair'),
    hero: img('my-chair', 'seat', 'My Chair'),
    materials: [
      {
        label: 'Frame',
        title: 'Galvanized pipes',
        text: 'Galvanized steel pipes joined with threaded elbows and tees give the chair its geometric order and rigidity.',
        image: img('my-chair', 'frame-pipes', 'Galvanized pipe elbow and tee joint'),
      },
      {
        label: 'Textile',
        title: 'Pink textile',
        text: 'A pleated pink textile wraps over the pipes, bringing flexibility and organic flow to the frame.',
        image: img('my-chair', 'textile-pleats', 'Pleated pink textile close-up'),
      },
      {
        label: 'In use',
        title: 'Frame and textile together',
        text: 'Rigid and flexible meet when someone sits in the chair.',
        image: null,
      },
    ],
    // Photos in originals/my-chair that v1 didn't use: hero, detail
    todo: ['One more sentence on the idea, material or making', 'Year, duration, tools', 'Photo of the chair in use', 'Detail and process photos'],
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
