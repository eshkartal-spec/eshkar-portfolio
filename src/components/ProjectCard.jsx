import { Link } from 'react-router-dom'
import './ProjectCard.css'

// One project in the Home page's work list: every project gets the same full-width tile.
// A frosted layer covers the photo until the tile reaches the middle of the screen (see useCenterFocus).
export default function ProjectCard({ project }) {
  const { cover } = project
  return (
    <Link to={`/projects/${project.slug}`} className="card reveal">
      <figure className="photo card__photo">
        <img
          src={cover.src}
          alt={cover.alt}
          loading="lazy"
          style={cover.position && { objectPosition: cover.position }}
        />
      </figure>
      <div className="card__frost" aria-hidden="true" />
      <p className="label card__field">{project.field}</p>
      <div className="card__text">
        <h3 className="display card__title">{project.title}</h3>
        <p className="sub card__summary">{project.summary}</p>
      </div>
      <span className="label card__go">
        <span className="card__go-text">View project </span>→
      </span>
    </Link>
  )
}
