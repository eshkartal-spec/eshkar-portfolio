import { site } from '../data/site'
import HeroReveal from '../components/HeroReveal'
import Library from '../components/Library'
import AboutIntro from '../components/AboutIntro'
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

      <section id="about" className="about wrap" aria-label="About">
        <AboutIntro about={site.about} skills={site.skills} />
      </section>
    </main>
  )
}
