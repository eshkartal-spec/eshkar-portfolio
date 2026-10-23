import { Link } from 'react-router-dom'
import './ProjectCard.css'

// One project in the Home page's work list
export default function ProjectCard({ project, number, featured = false }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className={`card reveal${featured ? ' card--featured' : ''}`}
    >
      <figure className="photo card__photo">
        <img src={project.cover.src} alt={project.cover.alt} loading={featured ? 'eager' : 'lazy'} />
      </figure>
      <div className="card__meta">
        <p className="label card__num">{number}</p>
        <div className="card__text">
          <h3 className="display card__title">{project.title}</h3>
          <p className="sub card__summary">{project.summary}</p>
        </div>
        <div className="card__side">
          <span className="label">{project.field}</span>
          <span className="label label--ink card__go">View project →</span>
        </div>
      </div>
    </Link>
  )
}
