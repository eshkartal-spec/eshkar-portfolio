import { site } from '../data/site'
import { projects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import './Home.css'

const num = (i) => String(i + 1).padStart(2, '0')

export default function Home() {
  const [featured, ...rest] = projects

  return (
    <main>
      <section className="hero wrap">
        <div className="hero__labels">
          <p className="label label--ink">{site.role}</p>
          <p className="label">{num(projects.length - 1)} — selected projects</p>
        </div>

        <h1 className="display hero__name" aria-label={site.name}>
          {site.name.split(' ').map((word, i) => (
            <span key={word} className="hero__word" style={{ '--i': i }}>
              <span>{word}</span>
            </span>
          ))}
        </h1>

        <div className="hero__body">
          <div className="hero__text">
            <p className="sub hero__tagline">{site.tagline}</p>
            <p className="hero__intro">{site.intro}</p>
            <div className="hero__actions">
              <a href="#work" className="pill pill--solid">See the work ↓</a>
              <a href="#contact" className="pill">Get in touch</a>
            </div>
          </div>
          <figure className="photo hero__photo">
            <img src={site.about.photo.src} alt={site.about.photo.alt} />
          </figure>
        </div>
      </section>

      <section id="work" className="work wrap">
        <div className="section-head">
          <p className="label label--ink">Selected work</p>
          <p className="label">{num(projects.length - 1)} projects</p>
        </div>

        <div className="work__featured">
          <ProjectCard project={featured} number={num(0)} featured />
        </div>

        <div className="work__grid">
          {rest.map((p, i) => (
            <ProjectCard key={p.slug} project={p} number={num(i + 1)} />
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
