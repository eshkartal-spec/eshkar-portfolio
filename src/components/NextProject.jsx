import { Link } from 'react-router-dom'
import './NextProject.css'

// Closes every project page: "Next project" in pink, with the project's name under it.
// The whole block is the link.
export default function NextProject({ project }) {
  return (
    <Link to={`/projects/${project.slug}`} className="next-project wrap">
      <span className="display next-project__title">Next project</span>
      <span className="sub next-project__name">
        {project.title}
        <span className="next-project__arrow" aria-hidden="true">→</span>
      </span>
    </Link>
  )
}
