import { Link } from 'react-router-dom'
import './ProjectCard.css'

// One project in the Home page's work list: every project gets the same full-width tile
export default function ProjectCard({ project, number, total }) {
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
      <div className="card__top">
        <span className="label">{number} / {total}</span>
        <span className="label">{project.field}</span>
      </div>
      <div className="card__bottom">
        <div className="card__text">
          <h3 className="display card__title">{project.title}</h3>
          <p className="sub card__summary">{project.summary}</p>
        </div>
        <span className="label card__go">View project →</span>
      </div>
    </Link>
  )
}
