import { site } from '../data/site'
import { projects } from '../data/projects'
import HeroReveal from '../components/HeroReveal'
import ProjectCard from '../components/ProjectCard'
import './Home.css'

const num = (i) => String(i + 1).padStart(2, '0')

export default function Home() {
  const total = num(projects.length - 1)

  return (
    <main className="home">
      <section className="hero">
        <HeroReveal image={site.hero} />
        <div className="hero__content wrap">
          <div className="hero__row">
            <p className="sub hero__tagline">
              {site.role}
              <br />
              {site.tagline}
            </p>
            <a href="#work" className="label hero__scroll">Scroll ↓</a>
          </div>
          <h1 className="display hero__name" aria-label={site.name}>
            {site.name.split(' ').map((word, i) => (
              <span key={word} className="hero__word" style={{ '--i': i }}>
                <span>{word}</span>
              </span>
            ))}
          </h1>
        </div>
      </section>

      <section id="work" className="work">
        <div className="section-head">
          <p className="label label--ink">Selected work</p>
          <p className="label">{total} projects</p>
        </div>
        <div className="work__list">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} number={num(i)} total={total} />
          ))}
        </div>
      </section>

      <section id="about" className="about wrap">
        <div className="section-head">
          <p className="label label--ink">About</p>
          <p className="label">{site.role}</p>
        </div>

        <div className="about__grid">
          <h2 className="display about__title reveal">{site.about.title}</h2>
          <div className="about__text reveal">
            {site.about.paragraphs.map((t, i) => (
              <p key={t} className={i === 0 ? 'about__lead' : undefined}>{t}</p>
            ))}
            <p className="label about__skills-label">Skills & tools</p>
            <ul className="about__skills">
              {site.skills.map((s) => <li key={s} className="pill">{s}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
