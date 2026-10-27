import { Link } from 'react-router-dom'
import './NextProject.css'

// Closes every project page: the next project, shown like an opened spine from the
// Home page's library (full-bleed photo, pink title, "View project"). The whole panel
// is the link.
export default function NextProject({ project }) {
  const { cover } = project
  return (
    <Link to={`/projects/${project.slug}`} className="next-project">
      <img
        className="next-project__photo"
        src={cover.src}
        alt=""
        loading="lazy"
        style={cover.position && { objectPosition: cover.position }}
      />
      <span className="next-project__top">
        <span className="label">Next project</span>
        <span className="label">{project.field}</span>
      </span>
      <span className="next-project__bottom">
        <span className="next-project__text">
          <span className="display next-project__title">{project.title}</span>
          <span className="sub next-project__summary">{project.summary}</span>
        </span>
        <span className="label next-project__go">View project →</span>
      </span>
    </Link>
  )
}
