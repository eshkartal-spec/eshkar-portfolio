import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { site } from './src/data/site.js'

// Prints a reminder when building for publishing while something is still missing
function prePublishChecks() {
  return {
    name: 'pre-publish-checks',
    apply: 'build',
    buildStart() {
      if (!site.contact.instagram) {
        this.warn('Instagram link is missing: set contact.instagram in src/data/site.js before publishing.')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prePublishChecks()],
})
