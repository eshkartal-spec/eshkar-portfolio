import { lazy, Suspense, useLayoutEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject, projects } from '../data/projects'
import NotFound from './NotFound'
import StairsPage from './StairsPage'
import NextProject from '../components/NextProject'
import ScrubVideo from '../components/ScrubVideo'
import SwapPhoto from '../components/SwapPhoto'
import DetailRow from '../components/DetailRow'
import PleatWarp from '../components/PleatWarp'
import PairSection from '../components/PairPlay'
import RippleWarp from '../components/RippleWarp'
import TextureReveal from '../components/TextureReveal'
import './ProjectPage.css'

// The 3D stage brings three.js with it, so it's only fetched for pages that have one
const ModelStage = lazy(() => import('../components/ModelStage'))

const num = (i) => String(i + 1).padStart(2, '0')

// A project can give its page a background of its own (backdrop): a color, optionally
// with soft pleats like fabric (index.css), for as long as the page is open
function useBackdrop(backdrop) {
  useLayoutEffect(() => {
    if (!backdrop) return
    const html = document.documentElement
    html.style.setProperty('--bg', backdrop.color)
    if (backdrop.pleats) html.dataset.pleats = ''
    return () => {
      html.style.removeProperty('--bg')
      delete html.dataset.pleats
    }
  }, [backdrop])
}

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
  useBackdrop(p?.backdrop)
  if (!p) return <NotFound />

  const index = projects.indexOf(p)
  const next = projects[(index + 1) % projects.length]
  if (p.layout === 'stairs') return <StairsPage project={p} next={next} />
  const title = p.fullTitle ?? p.title
  const specs = [['Type', p.type], ['Year', p.year], ['Duration', p.duration], ['Tools', p.tools]].filter(
    ([, v]) => v,
  )

  return (
    <main
      className={`proj${p.opening ? ' proj--opening' : ''}${p.centered ? ' proj--centered' : ''}`}
      // Without a photo above it, a video played by scrolling comes out of the page itself
      style={{ '--fade': p.opening?.fade ?? (p.scrub ? 'var(--bg)' : undefined) }}
    >
      {p.opening ? (
        // A full-screen photo with the title already on it (also here, hidden, for screen
        // readers and search engines), and the details along its bottom
        <header className={`proj__opening${p.opening.tall && !p.opening.whole ? '' : ' proj__opening--whole'}`}>
          {p.opening.warp ? (
            <PleatWarp wide={p.opening.wide} tall={p.opening.tall} />
          ) : p.opening.texture ? (
            <TextureReveal
              wide={p.opening.wide}
              tall={p.opening.tall}
              texture={p.opening.texture}
              pixels={p.opening.pixels}
            />
          ) : p.opening.ripples ? (
            <RippleWarp wide={p.opening.wide} tall={p.opening.tall} />
          ) : (
            <picture>
              {p.opening.tall && <source media="(orientation: portrait)" srcSet={p.opening.tall.src} />}
              <img src={p.opening.wide.src} alt={p.opening.wide.alt} />
            </picture>
          )}
          <h1 className="visually-hidden">{title}</h1>
          {specs.length > 0 && (
            <dl className="specs proj__opening-specs wrap">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt className="label">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>
      ) : (
        <>
          <header className="proj__head wrap">
            <div className="proj__crumbs">
              <Link to="/#work" className="label label--ink proj__back">← All work</Link>
              <p className="label">{p.field}</p>
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
        </>
      )}

      {/* The summary over a video played by scrolling, in place of the overview */}
      {p.scrub ? (
        <ScrubVideo video={p.scrub}>
          <p className="sub">{p.scrubText ?? p.summary}</p>
        </ScrubVideo>
      ) : (
        <section className={`proj__intro wrap${p.introOnPhoto ? ' proj__intro--on-photo' : ''}`}>
          <p className="label label--ink proj__intro-label">{p.introLabel ?? 'Overview'} — {title}</p>
          <p className="proj__intro-text reveal">{p.intro}</p>
          {p.hero && p.hero.src !== (p.banner ?? p.cover).src && (
            <Photo image={p.hero} className="proj__intro-photo reveal" />
          )}
        </section>
      )}

      {p.model && (
        <Suspense fallback={<div style={{ height: '100svh' }} />}>
          <ModelStage model={p.model} />
        </Suspense>
      )}
      {p.details && <DetailRow items={p.details} />}
      {p.swap && <SwapPhoto images={p.swap} />}
      {p.pairs?.map((pair) => <PairSection key={pair.title} pair={pair} />)}

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

      <NextProject project={next} />
    </main>
  )
}
