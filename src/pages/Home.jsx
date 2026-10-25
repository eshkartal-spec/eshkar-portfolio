import { site } from '../data/site'
import HeroReveal from '../components/HeroReveal'
import Library from '../components/Library'
import NamePeek from '../components/NamePeek'
import './Home.css'

export default function Home() {
  return (
    <main className="home">
      {site.showHero && (
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
      )}

      <Library />

      <section id="about" className="about wrap">
        <div className="section-head">
          <p className="label label--ink">About</p>
        </div>

        <div className="about__grid">
          <h2 className="display about__title reveal">
            {site.about.titleBefore}
            <NamePeek word={site.about.titleName} image={site.about.photo} />
            {site.about.titleAfter}
          </h2>
          <div className="about__text reveal">
            {site.about.paragraphs.map((t) => <p key={t}>{t}</p>)}
          </div>

          {/* Full width, under both columns */}
          <details className="skills reveal">
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
      </section>
    </main>
  )
}
