import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { projects } from '../data/projects'

// Bare starting point: every piece of content, no design yet.
export default function Home() {
  return (
    <main className="page">
      <section>
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
        <p>{site.intro}</p>
      </section>

      <section>
        <h2>Work</h2>
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link to={`/projects/${p.slug}`}>
                <img src={p.cover.src} alt={p.cover.alt} loading="lazy" />
                <strong>{p.title}</strong> · {p.field}
                <br />
                {p.summary}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="about">
        <h2>{site.about.title}</h2>
        <img src={site.about.photo.src} alt={site.about.photo.alt} className="portrait" />
        {site.about.paragraphs.map((t) => <p key={t}>{t}</p>)}
        <h3>Process</h3>
        <ol>{site.process.map((s) => <li key={s}>{s}</li>)}</ol>
        <h3>Skills & tools</h3>
        <p>{site.skills.join(' · ')}</p>
      </section>

      <section id="contact">
        <h2>Get in touch</h2>
        <p>{site.contact.pitch}</p>
        <p>
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          <br />
          <a href={site.contact.phoneLink}>{site.contact.phone}</a>
          <br />
          <a href={site.resume} target="_blank" rel="noreferrer">View resume</a>
        </p>
      </section>
    </main>
  )
}
