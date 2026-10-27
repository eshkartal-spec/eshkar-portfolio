import { Link, useParams } from 'react-router-dom'
import { getProject, projects } from '../data/projects'
import NotFound from './NotFound'
import NextProject from '../components/NextProject'
import './ImagesPage.css'

const num = (i) => String(i + 1).padStart(2, '0')

// A project's "More images" page (/projects/<slug>/images): its photos in groups, each
// shown whole, in columns, then its process, then the next project
export default function ImagesPage() {
  const { slug } = useParams()
  const p = getProject(slug)
  if (!p?.more) return <NotFound />

  const next = projects[(projects.indexOf(p) + 1) % projects.length]
  return (
    <main className="images">
      <header className="images__head wrap">
        <Link to={`/projects/${p.slug}`} className="label label--ink images__back">← {p.title}</Link>
        <h1 className="display images__title">
          <span>More images</span>
        </h1>
      </header>

      {p.more.sections.map((s) => (
        <section key={s.title} className="images__section wrap">
          <div className="section-head">
            <p className="label label--ink">{s.title}</p>
            <p className="label">{num(s.items.length - 1)}</p>
          </div>
          <div className="images__grid" style={{ '--cols': Math.min(3, s.items.length) }}>
            {s.items.map((image) => (
              <figure key={image.src} className="images__item reveal">
                <img src={image.src} alt={image.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      ))}

      {p.process?.length > 0 && (
        <section className="images__section wrap">
          <div className="section-head">
            <p className="label label--ink">Process</p>
            <p className="label">{p.process.map((s) => s.label).join(' → ')}</p>
          </div>
          <div className="images__grid">
            {p.process.map((s, i) => (
              <figure key={s.label} className="images__item reveal">
                <img src={s.image.src} alt={s.image.alt} loading="lazy" />
                <figcaption>
                  <p className="label label--ink">{num(i)} — {s.label}</p>
                  <p className="images__cap">{s.image.alt}.</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <NextProject project={next} />
    </main>
  )
}
