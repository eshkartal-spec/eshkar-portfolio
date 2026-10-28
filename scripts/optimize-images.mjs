// Turns the full-size photos in /originals into web-sized copies in /public/images.
//
//   originals/shattered form/17 copy.jpg  →  public/images/shattered-form/17-copy.webp
//
// Videos become silent web videos ready to be scrubbed by scrolling (a keyframe every
// few frames, so jumping to any moment is quick), with their first frame as a poster:
//
//   originals/my-chair/pipe video.mp4  →  public/images/my-chair/pipe-video.mp4 (+ .webp)
//
// Run it with:  npm run images
// Only new or changed files are processed, so it's quick to re-run.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import sharp from 'sharp'
import ffmpeg from 'ffmpeg-static'

const SRC = 'originals'
const OUT = 'public/images'
const MAX_WIDTH = 2400
// Banners and other full-screen photos ("banner" or "wide" in the name) keep enough
// width for a retina laptop
const BANNER_WIDTH = 2880
const FULL_SCREEN = /banner|wide/i
const QUALITY = 80
const VIDEO_WIDTH = 1280

// Lowercase, with anything but letters and digits turned into single dashes
const clean = (name) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

if (!fs.existsSync(SRC)) {
  console.log('No originals folder, nothing to do.')
  process.exit(0)
}

let made = 0
let skipped = 0
for (const folder of fs.readdirSync(SRC)) {
  const srcDir = path.join(SRC, folder)
  if (!fs.statSync(srcDir).isDirectory()) continue
  const outDir = path.join(OUT, clean(folder))
  fs.mkdirSync(outDir, { recursive: true })

  for (const file of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, file)
    const name = path.join(outDir, clean(path.parse(file).name))
    const upToDate = (out) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs

    if (/\.(mp4|mov|m4v|webm)$/i.test(file)) {
      if (upToDate(name + '.mp4')) {
        skipped++
        continue
      }
      // Black bars along the edges (letterboxing) are cropped off: they'd show on screens
      // shaped differently from the video
      const found = spawnSync(ffmpeg, ['-hide_banner', '-i', src, '-vf', 'cropdetect=limit=24:round=2:reset=0',
        '-f', 'null', '-']).stderr.toString().match(/crop=\d+:\d+:\d+:\d+/g)
      const crop = found ? `${found.at(-1)},` : ''
      // H.264 (plays everywhere), no sound, a keyframe every 6 frames, no B-frames
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-an',
        '-vf', `${crop}scale=${VIDEO_WIDTH}:-2,setsar=1`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
        '-g', '6', '-bf', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', name + '.mp4'])
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', name + '.mp4', '-frames:v', '1', name + '.png'])
      await sharp(name + '.png').webp({ quality: QUALITY }).toFile(name + '.webp')
      fs.rmSync(name + '.png')
      made++
      console.log('  ✓', name + '.mp4')
      continue
    }

    if (!/\.(jpe?g|png|webp|tiff?)$/i.test(file)) continue
    const out = name + '.webp'
    if (upToDate(out)) {
      skipped++
      continue
    }
    await sharp(src)
      .rotate()
      .resize({ width: FULL_SCREEN.test(file) ? BANNER_WIDTH : MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out)
    made++
    console.log('  ✓', out)
  }
}
console.log(`Done: ${made} made, ${skipped} already up to date.`)
