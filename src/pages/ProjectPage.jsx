import { Link, useParams } from 'react-router-dom'
import { getProject, projects } from '../data/projects'
import NotFound from './NotFound'
import './ProjectPage.css'

const num = (i) => String(i + 1).padStart(2, '0')

const Photo = ({ image, className = '' }) =>
  image && (
    <figure className={`photo ${className}`}>
      <img src={image.src} alt={image.alt} loading="lazy" />
    </figure>
  )

// Numbered blocks with an optional photo: used for features and materials
function Blocks({ title, items }) {
  return (
    <section className="proj__section wrap">
      <div className="section-head">
        <p className="label label--ink">{title}</p>
        <p className="label">{num(items.length - 1)}</p>
      </div>
      <div className="blocks">
        {items.map((b, i) => (
          <article key={i} className="block reveal">
            <Photo image={b.image} className="block__photo" />
            <p className="label block__num">
              {num(i)} / {num(items.length - 1)}
              {b.label && ` — ${b.label}`}
            </p>
            {b.title && <h3 className="block__title">{b.title}</h3>}
            {b.text && <p className="block__text">{b.text}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}

export default function ProjectPage() {
  const { slug } = useParams()
  const p = getProject(slug)
  if (!p) return <NotFound />

  const index = projects.indexOf(p)
  const next = projects[(index + 1) % projects.length]
  const title = p.fullTitle ?? p.title
  const specs = [['Type', p.type], ['Year', p.year], ['Duration', p.duration], ['Tools', p.tools]].filter(
    ([, v]) => v,
  )

  return (
    <main className="proj">
      <header className="proj__head wrap">
        <div className="proj__crumbs">
          <Link to="/#work" className="label label--ink proj__back">← All work</Link>
          <p className="label">
            {num(index)} / {num(projects.length - 1)} — {p.field}
          </p>
        </div>

        <h1 className="display proj__title" style={{ '--chars': p.title.length }}>
          <span>{p.title}</span>
        </h1>

        <div className="proj__lede">
          <p className="sub proj__summary">{p.summary}</p>
          {specs.length > 0 && (
            <dl className="specs">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt className="label">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </header>

      <Photo image={p.banner ?? p.cover} className="proj__cover" />

      <section className="proj__intro wrap">
        <p className="label label--ink proj__intro-label">Overview — {title}</p>
        <p className="proj__intro-text reveal">{p.intro}</p>
        {p.hero.src !== (p.banner ?? p.cover).src && (
          <Photo image={p.hero} className="proj__intro-photo reveal" />
        )}
      </section>

      {p.pull && (
        <section className="band">
          <div className="band__inner wrap">
            <p className="sub band__quote reveal">{p.pull}</p>
            <Photo image={p.heroAlt} className="band__photo reveal" />
          </div>
        </section>
      )}

      {p.features?.length > 0 && <Blocks title="Key features" items={p.features} />}
      {p.materials?.length > 0 && <Blocks title="Materials" items={p.materials} />}

      {p.gallery?.length > 0 && (
        <section className="proj__section wrap">
          <div className="section-head">
            <p className="label label--ink">Details & in use</p>
            <p className="label">Studio & street</p>
          </div>
          <div className="gallery">
            {p.gallery.map((g) => <Photo key={g.src} image={g} className="gallery__item reveal" />)}
          </div>
        </section>
      )}

      {p.process?.length > 0 && (
        <section className="proj__section wrap">
          <div className="section-head">
            <p className="label label--ink">Behind the product</p>
            <p className="label">{p.process.map((s) => s.label).join(' → ')}</p>
          </div>
          <div className="process">
            {p.process.map((s, i) => (
              <figure key={s.label} className="process__step reveal">
                <Photo image={s.image} className="process__photo" />
                <figcaption>
                  <p className="label label--ink">{num(i)} — {s.label}</p>
                  <p className="process__cap">{s.image.alt}.</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Only while working locally: what the project still needs */}
      {import.meta.env.DEV && p.todo && (
        <section className="todo wrap">
          <p className="label label--ink">Still missing (only visible locally)</p>
          <ul>{p.todo.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}

      <Link to={`/projects/${next.slug}`} className="next wrap">
        <div className="section-head">
          <p className="label label--ink">Next project</p>
          <p className="label">{num(projects.indexOf(next))}</p>
        </div>
        <div className="next__row">
          <h2 className="display next__title">{next.title} <span aria-hidden="true">→</span></h2>
          <Photo image={next.cover} className="next__photo" />
        </div>
      </Link>
    </main>
  )
}
