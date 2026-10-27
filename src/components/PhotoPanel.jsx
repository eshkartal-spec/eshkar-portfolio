import { Link } from 'react-router-dom'
import './PhotoPanel.css'

// A full-bleed photo panel, shown like an opened spine from the Home page's library: an
// optional label above, the title with a subtitle under it, and a "go" link along the
// bottom. The whole panel is the link. `eager` loads the photo right away, for a panel
// that fades in rather than scrolls in.
export default function PhotoPanel({ to, photo, label, title, subtitle, go, eager }) {
  return (
    <Link to={to} className="photo-panel">
      <img
        className="photo-panel__photo"
        src={photo.src}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        style={photo.position && { objectPosition: photo.position }}
      />
      {label && <span className="label photo-panel__label">{label}</span>}
      <span className="photo-panel__bottom">
        <span className="photo-panel__text">
          <span className="display photo-panel__title">{title}</span>
          {subtitle && <span className="sub photo-panel__subtitle">{subtitle}</span>}
        </span>
        <span className="label photo-panel__go">{go}</span>
      </span>
    </Link>
  )
}
