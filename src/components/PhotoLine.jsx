import './ScrubVideo.css'
import './PhotoLine.css'

// A big framed photo with a line along its bottom, over a white fade: the same look as a
// video played on a loop (ScrubVideo.jsx, whose styles it shares, its frame taking the
// photo's shape), and on tall screens likewise shown whole with the line under it
export default function PhotoLine({ photo }) {
  return (
    <section className="scrub scrub--loop photo-line">
      <div className="scrub__view">
        <img
          className="scrub__video"
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget
            if (w && h) e.currentTarget.closest('.scrub').style.setProperty('--r', `${w} / ${h}`)
          }}
        />
        <div className="scrub__text wrap">
          <p className="sub">{photo.line}</p>
        </div>
      </div>
    </section>
  )
}
