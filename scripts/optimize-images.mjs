// Turns the full-size photos in /originals into web-sized copies in /public/images.
//
//   originals/shattered form/17 copy.jpg  →  public/images/shattered-form/17-copy.webp
//
// Videos become silent web videos ready to be scrubbed by scrolling (a keyframe every
// few frames, so jumping to any moment is quick), with their first frame as a poster:
//
//   originals/my-chair/pipe video.mp4  →  public/images/my-chair/pipe-video.mp4 (+ .webp)
//
// And 3D models (a .gltf with its .bin, also one folder down, or a .glb) become one small
// .glb, its shapes compressed (decoded on the page by three.js's meshopt decoder):
//
//   originals/playstation/Part2/Part2.gltf  →  public/images/playstation/part2.glb
//
// Run it with:  npm run images
// Only new or changed files are processed, so it's quick to re-run.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import sharp from 'sharp'
import ffmpeg from 'ffmpeg-static'
import { NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions'
import { dedup, prune, quantize, reorder } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'

const SRC = 'originals'
const OUT = 'public/images'
const MAX_WIDTH = 2400
// Banners and other full-screen photos ("banner" or "wide" in the name) keep enough
// width for a retina laptop
const BANNER_WIDTH = 2880
const FULL_SCREEN = /banner|wide|tex/i
const QUALITY = 80
const VIDEO_WIDTH = 1280
// Videos cut to a set part of the frame instead (width:height:left:top, in the video's
// pixels): a screen recording keeps only the modeling area, without the program around it
const VIDEO_CROPS = {
  'playstation/video.mp4': '1154:880:246:200',
}
// ...and a small patch painted over with what's around it (x:y:width:height, before the
// cut): the corner axes marker
const VIDEO_PATCHES = {
  'playstation/video.mp4': '236:940:156:110',
}
// ...and sped up (2: twice as fast, and half as long)
const VIDEO_SPEEDS = {
  'playstation/video.mp4': 2,
}

const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
})

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

  // The folder's files, and models in the folders inside it
  const files = fs.readdirSync(srcDir).flatMap((file) =>
    fs.statSync(path.join(srcDir, file)).isDirectory()
      ? fs.readdirSync(path.join(srcDir, file)).filter((f) => /\.gltf$/i.test(f)).map((f) => path.join(file, f))
      : [file],
  )
  for (const file of files) {
    const src = path.join(srcDir, file)
    const name = path.join(outDir, clean(path.parse(file).name))
    const upToDate = (out) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs

    if (/\.(gltf|glb)$/i.test(file)) {
      if (upToDate(name + '.glb')) {
        skipped++
        continue
      }
      // Shapes stored more compactly (quantize), in a better order (reorder) and compressed
      // (meshopt); the look is unchanged
      await MeshoptEncoder.ready
      const doc = await io.read(src)
      await doc.transform(dedup(), prune(), reorder({ encoder: MeshoptEncoder }), quantize())
      doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
        method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
      })
      await io.write(name + '.glb', doc)
      made++
      console.log('  ✓', name + '.glb')
      continue
    }

    if (/\.(mp4|mov|m4v|webm)$/i.test(file)) {
      if (upToDate(name + '.mp4')) {
        skipped++
        continue
      }
      const key = `${folder}/${file}`
      // Black bars along the edges (letterboxing) are cropped off: they'd show on screens
      // shaped differently from the video
      const found = VIDEO_CROPS[key]
        ? null
        : spawnSync(ffmpeg, ['-hide_banner', '-i', src, '-vf', 'cropdetect=limit=24:round=2:reset=0',
          '-f', 'null', '-']).stderr.toString().match(/crop=\d+:\d+:\d+:\d+/g)
      const patch = VIDEO_PATCHES[key] ? `delogo=${VIDEO_PATCHES[key].replace(/^(\d+):(\d+):(\d+):(\d+)$/, 'x=$1:y=$2:w=$3:h=$4')},` : ''
      const crop = patch + (VIDEO_CROPS[key] ? `crop=${VIDEO_CROPS[key]},` : found ? `${found.at(-1)},` : '')
      const speed = VIDEO_SPEEDS[key] ? `setpts=PTS/${VIDEO_SPEEDS[key]},fps=30,` : ''
      // H.264 (plays everywhere), no sound, a keyframe every 6 frames, no B-frames
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-an',
        '-vf', `${crop}${speed}scale=${VIDEO_WIDTH}:-2,setsar=1`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
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
