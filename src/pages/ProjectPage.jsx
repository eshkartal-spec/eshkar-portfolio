import { Link, useParams } from 'react-router-dom'
import { getProject, projects } from '../data/projects'
import NotFound from './NotFound'

const Img = ({ image }) => image && <img src={image.src} alt={image.alt} loading="lazy" />

// Bare starting point: every piece of content, no design yet.
export default function ProjectPage() {
  const { slug } = useParams()
  const p = getProject(slug)
  if (!p) return <NotFound />

  const next = projects[(projects.indexOf(p) + 1) % projects.length]
  const facts = [['Type', p.type], ['Year', p.year], ['Duration', p.duration], ['Tools', p.tools]]

  return (
    <main className="page">
      <Link to="/">← All work</Link>
      <h1>{p.fullTitle ?? p.title}</h1>
      <p>{p.intro}</p>
      <dl className="facts">
        {facts.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>
        ))}
      </dl>
      <Img image={p.hero} />
      <Img image={p.heroAlt} />

      {p.features && (
        <section>
          <h2>Key features</h2>
          {p.features.map((f, i) => (
            <div key={i}>
              <h3>{f.title ?? '—'}</h3>
              {f.text && <p>{f.text}</p>}
              <Img image={f.image} />
            </div>
          ))}
        </section>
      )}

      {p.materials && (
        <section>
          <h2>Materials</h2>
          {p.materials.map((m) => (
            <div key={m.label}>
              <h3>{m.label}: {m.title}</h3>
              <p>{m.text}</p>
              <Img image={m.image} />
            </div>
          ))}
        </section>
      )}

      {p.gallery && (
        <section>
          <h2>Details & in use</h2>
          {p.gallery.map((g) => <Img key={g.src} image={g} />)}
        </section>
      )}

      {p.process && (
        <section>
          <h2>Process</h2>
          {p.process.map((s) => (
            <div key={s.label}>
              <h3>{s.label}</h3>
              <Img image={s.image} />
              <p>{s.image.alt}</p>
            </div>
          ))}
        </section>
      )}

      {p.todo && (
        <section className="todo">
          <h2>Still missing</h2>
          <ul>{p.todo.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}

      <p>
        <Link to={`/projects/${next.slug}`}>Next project: {next.title} →</Link>
      </p>
    </main>
  )
}
