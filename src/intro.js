export const INTRO_SEEN_KEY = 'intro-seen'

// The intro plays once per browser tab. Add ?intro to the address to see it again.
export function shouldPlayIntro() {
  if (new URLSearchParams(window.location.search).has('intro')) return true
  try {
    return !window.sessionStorage.getItem(INTRO_SEEN_KEY)
  } catch {
    return true
  }
}
