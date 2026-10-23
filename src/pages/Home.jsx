import { site } from '../data/site'
import { projects } from '../data/projects'
import HeroReveal from '../components/HeroReveal'
import ProjectCard from '../components/ProjectCard'
import { useCenterFocus } from '../useCenterFocus'
import './Home.css'

export default function Home() {
  useCenterFocus('.card')

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
        </div>
        <div className="work__list">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      <section id="about" className="about wrap">
        <div className="section-head">
          <p className="label label--ink">About</p>
        </div>

        <div className="about__grid">
          <h2 className="display about__title reveal">{site.about.title}</h2>
          <div className="about__text reveal">
            {site.about.paragraphs.map((t) => <p key={t}>{t}</p>)}

            <details className="skills">
              <summary className="skills__toggle">
                <span className="label label--ink">Skills & tools</span>
                <span className="skills__icon" aria-hidden="true" />
              </summary>
              <div className="skills__groups">
                {site.skills.map(({ group, items }) => (
                  <div key={group} className="skills__group">
                    <p className="label">{group}</p>
                    <ul className="skills__list">
                      {items.map((s) => <li key={s} className="pill">{s}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </section>
    </main>
  )
}
