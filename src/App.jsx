import { useLayoutEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Intro from './components/Intro'
import Home from './pages/Home'
import ProjectPage from './pages/ProjectPage'
import ImagesPage from './pages/ImagesPage'
import NotFound from './pages/NotFound'
import { useReveal } from './useReveal'
import { useNoOrphans } from './noOrphans'

// Opening a page starts at its top, or at the part its address names (like /#about)
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    const el = hash && document.getElementById(hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
}

export default function App({ playIntro }) {
  const [showIntro, setShowIntro] = useState(playIntro)
  const { pathname } = useLocation()
  useScrollOnNavigate()
  useReveal(pathname)
  useNoOrphans()

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
        <Route path="/projects/:slug/images" element={<ImagesPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Contact details live on the Home page only, and end with the footer line; other
          pages end with the footer on its own */}
      {pathname === '/' ? <Contact /> : <Footer />}
      {showIntro && <Intro onDone={() => setShowIntro(false)} />}
    </>
  )
}
