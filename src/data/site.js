// Personal details used across the site (carried over from v1).
export const site = {
  name: 'Eshkar Karish',
  role: 'Industrial designer',
  tagline: 'Designing meaningful solutions for everyday life.',
  intro: 'I design physical products, from user need to functional prototype.',
  // Full-screen photo at the top of the Home page. To change it, replace
  // originals/hero/hero.png and run `npm run images`.
  // position: which part stays in view when the photo is cropped (0–1, left→right, top→bottom)
  hero: { src: '/images/hero/hero.webp', alt: 'Eshkar Karish', position: [0.5, 0.25] },
  about: {
    title: "Hi! I'm Eshkar.",
    paragraphs: [
      'I’m a fourth-year Industrial Design student in Israel, focused on creating thoughtful, user-centered physical products.',
      'Combining research, ergonomics and hands-on prototyping, I design intuitive solutions that balance functionality, aesthetics and real-world usability.',
    ],
    photo: { src: '/images/about/portrait.webp', alt: 'Eshkar Karish' },
  },
  skills: [
    'Industrial Design', 'Product Design', 'Product Development', 'User Research',
    'Human-Centered Design', 'Concept Development', 'Sketching & Ideation', 'Prototyping',
    'Model Making', 'CAD', 'SolidWorks', '3D Modeling', '3D Printing', 'KeyShot',
    'Rendering', 'Adobe Creative Suite',
  ],
  contact: {
    pitch:
      'For industrial and product design studios, product companies, startups, founders and collaborators. I’m open to full-time roles, internships and projects.',
    email: 'eshkartal@gmail.com',
    phone: '058-594-0094',
    phoneLink: 'tel:+972585940094',
  },
  // Still hosted on her old Wix site; worth moving into /public before Wix goes away
  resume:
    'https://d18cb1d5-aac7-40f3-8e01-db90374d859c.filesusr.com/ugd/d8324e_0c669b58a6334a8196a9cd530e242003.pdf',
}
