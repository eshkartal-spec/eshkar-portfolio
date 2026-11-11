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
// ...and trimmed to a stretch of it (seconds from the start: [from, to])
const VIDEO_TRIMS = {
  // (the fabric still before 2s and after 10.5s)
  'my-chair/pipe video.mp4': [2, 10.5],
}
// ...and sped up (2: twice as fast, and half as long)
const VIDEO_SPEEDS = {
  'playstation/video.mp4': 2,
  'shrafraf/shrafraf.mp4': 2.5,
}
// ...and slowed down smoothly over its last `tail` seconds, to `end` times its speed at
// the very end, easing to a stop instead of halting (the slow part given new in-between
// frames, at 60 a second, so it stays smooth)
const VIDEO_EASE_OUT = {
  'shrafraf/shrafrafBOUNCE.mp4': { tail: 1.1, end: 0.3 },
}
// ...and wider, for a full-screen banner
const VIDEO_WIDTHS = {
  'shrafraf/shrafrafBOUNCE.mp4': 1920,
}
// ...and with the poster taken from the last frame instead of the first (a clip that
// ends at rest, shown still until it plays)
const POSTER_AT_END = new Set(['shrafraf/shrafrafBOUNCE.mp4'])
// Videos that only ever play straight through (not by scrolling) don't need a keyframe
// every few frames, and come out far smaller without
const PLAYED_THROUGH = new Set(['shrafraf/shrafraf.mp4', 'shrafraf/shrafrafBOUNCE.mp4'])

// Cut-out photos trimmed to the object, without the see-through margin around it (the
// Odds or Evens halves, which the page sizes and fits together by their pixels), and
// optionally first turned (degrees, clockwise: so a triangle's long black edge or a
// circle half's ends stand straight; 180 turns it upside down), scaled (by a factor, or to
// a height in pixels: to match its partner's size) and brightened or toned down (sharp's
// modulate: to match the other whites)
const CUTOUTS = {
  'odds-or-evens/whitetriangle2.png': { turn: -12.49 },
  'odds-or-evens/browntriangle2.png': { turn: -17.33, scale: 1191 / 1320 },
  'odds-or-evens/whitecircle2.png': { turn: 3.47, height: 1268 },
  'odds-or-evens/brown circle2.png': { turn: -0.47 },
  'odds-or-evens/whitePYR.png': { modulate: { brightness: 1.08, saturation: 0.55 } },
  'odds-or-evens/brownPYR.png': { turn: 180 },
}

// Photos exported lying on their side, turned upright (degrees, clockwise)
const TURNS = {
  'bazelet/bazeletBANNERmobile.png': 90,
}

// Web names of their own, for originals that would otherwise share one (the same name,
// a different file type)
const NAMES = {
  'bazelet/product.jpg': 'product-stone',
  'bazelet/product.png': 'product-log',
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

  // The folder's files, and the photos and models in the folders inside it (their web
  // copies go in with the rest, under their own names)
  const files = fs.readdirSync(srcDir).flatMap((file) =>
    fs.statSync(path.join(srcDir, file)).isDirectory()
      ? fs.readdirSync(path.join(srcDir, file)).filter((f) => /\.(gltf|jpe?g|png|webp|tiff?)$/i.test(f)).map((f) => path.join(file, f))
      : [file],
  )
  for (const file of files) {
    const src = path.join(srcDir, file)
    const name = path.join(outDir, NAMES[`${folder}/${file}`] ?? clean(path.parse(file).name))
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
      const keyframes = PLAYED_THROUGH.has(key) ? ['-crf', '27'] : ['-crf', '24', '-g', '6', '-bf', '0']
      const trim = VIDEO_TRIMS[key] ? ['-ss', String(VIDEO_TRIMS[key][0]), '-to', String(VIDEO_TRIMS[key][1])] : []
      const look = `${crop}${speed}scale=${VIDEO_WIDTHS[key] ?? VIDEO_WIDTH}:-2,setsar=1`
      let filter = ['-vf', look]
      const ease = VIDEO_EASE_OUT[key]
      if (ease) {
        // the clip as it is up to the tail; the tail's speed falling evenly from 1 to
        // `end` (each moment pushed later by the time it has lost), then filled in
        const [, hh, mm, ss] = spawnSync(ffmpeg, ['-i', src]).stderr.toString().match(/Duration: (\d+):(\d+):([\d.]+)/)
        const length = Number(hh) * 3600 + Number(mm) * 60 + Number(ss)
        const from = length - ease.tail
        const k = 1 - ease.end
        filter = ['-filter_complex', [
          `[0:v]split[a][b]`,
          `[a]trim=0:${from},setpts=PTS-STARTPTS,fps=60[head]`,
          `[b]trim=${from},setpts=PTS-STARTPTS,setpts='-(${ease.tail}/${k})*log(1-${k}*T/${ease.tail})/TB',minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1[tail]`,
          `[head][tail]concat=n=2:v=1[c]`,
          `[c]${look}[out]`,
        ].join(';'), '-map', '[out]']
      }
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, ...trim, '-an',
        ...filter, '-c:v', 'libx264', '-preset', 'slow',
        ...keyframes, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', name + '.mp4'])
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...(POSTER_AT_END.has(key) ? ['-sseof', '-0.1'] : []),
        '-i', name + '.mp4', '-frames:v', '1', '-update', '1', name + '.png'])
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
    let photo = sharp(src).rotate()
    const turn = TURNS[`${folder}/${file}`]
    if (turn) photo = sharp(await photo.png().toBuffer()).rotate(turn)
    const cut = CUTOUTS[`${folder}/${file}`]
    if (cut) {
      // (each step on the last one's result: sharp would otherwise run them in its own order)
      let buf = await photo.png().toBuffer()
      if (cut.turn) buf = await sharp(buf).rotate(cut.turn, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
      buf = await sharp(buf).trim().png().toBuffer()
      if (cut.height) buf = await sharp(buf).resize({ height: cut.height }).png().toBuffer()
      if (cut.scale) {
        const { width } = await sharp(buf).metadata()
        buf = await sharp(buf).resize({ width: Math.round(width * cut.scale) }).png().toBuffer()
      }
      if (cut.modulate) buf = await sharp(buf).modulate(cut.modulate).png().toBuffer()
      photo = sharp(buf)
    }
    await photo
      .resize({ width: FULL_SCREEN.test(file) ? BANNER_WIDTH : MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out)
    made++
    console.log('  ✓', out)
  }
}
console.log(`Done: ${made} made, ${skipped} already up to date.`)
