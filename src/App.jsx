import { useLayoutEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Contact from './components/Contact'
import Home from './pages/Home'
import ProjectPage from './pages/ProjectPage'
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

export default function App() {
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Contact />
    </>
  )
}
