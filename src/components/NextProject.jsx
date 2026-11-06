import { Link } from 'react-router-dom'
import './NextProject.css'

// Closes every project page: "Next project" in pink, with the project's name under it.
// The whole block is the link. Pointed at, it fills with the next project's photo behind
// frosted glass, like the stowed spines on the Home page.
export default function NextProject({ project }) {
  const cover = project.cover
  return (
    <Link to={`/projects/${project.slug}`} className="next-project wrap">
      <span className="next-project__glass" aria-hidden="true">
        <img src={cover.src} alt="" loading="lazy" style={{ objectPosition: cover.position }} />
        <span className="next-project__frost" />
      </span>
      <span className="display next-project__title">Next project</span>
      <span className="sub next-project__name">
        {project.title}
        <span className="next-project__arrow" aria-hidden="true">→</span>
      </span>
    </Link>
  )
}
