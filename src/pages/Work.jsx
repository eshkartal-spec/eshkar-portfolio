import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import './Work.css'

const COMING = 1 // how many "more work soon" places follow the finished projects
const no = (i) => String(i + 1).padStart(2, '0')

// Every project in a neat gallery, numbered in order (01 Step Up to 06 Bazelet), and the
// next number already waiting with "More work soon". Each number is drawn as a pink
// outline behind the top of its card; pointed at, it fills in from the bottom like ink.
// The place still to come is filled a little way, like work in progress.
export default function Work() {
  return (
    <main className="work wrap">
      <header className="work__head">
        <h1 className="display work__title">Work</h1>
        <p className="label work__count">
          {no(0)} — {no(projects.length - 1)} · more soon
        </p>
      </header>

      <ol className="work__grid">
        {projects.map((p, i) => (
          <li key={p.slug} className="work__item reveal" style={{ '--d': i % 3 }}>
            <Link to={`/projects/${p.slug}`} className="work__card">
              <span className="display work__no" aria-hidden="true">{no(i)}</span>
              <span className="work__photo">
                <img src={p.cover.src} alt={p.cover.alt} loading="lazy" style={{ objectPosition: p.cover.position }} />
              </span>
              <span className="work__text">
                <span className="display work__name">{p.title}</span>
                <span className="label work__field">{p.field}</span>
              </span>
            </Link>
          </li>
        ))}

        {Array.from({ length: COMING }, (_, k) => (
          <li key={`soon-${k}`} className="work__item work__item--soon reveal" style={{ '--d': (projects.length + k) % 3 }}>
            <div className="work__card">
              <span className="display work__no" aria-hidden="true">{no(projects.length + k)}</span>
              <span className="work__photo work__soon">
                <span className="work__frost" />
                <span className="sub work__soon-text">More work soon</span>
              </span>
              <span className="work__text">
                <span className="display work__name">In the making</span>
                <span className="label work__field">Coming next</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
