// Writes src/data/imageSizes.json: the intrinsic width and height of every image under
// public/media, so <Figure> and <Video> can set width/height and reserve space before loading.
// Run `npm run images:sizes` after adding or replacing a case-study image.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pub = join(root, 'public')
const out = join(root, 'src', 'data', 'imageSizes.json')

function webpSize(b) {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = b.toString('ascii', 12, 16)
  if (chunk === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)]
  }
  if (chunk === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
  return null
}

function pngSize(b) {
  return b.toString('ascii', 1, 4) === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null
}

function jpegSize(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xff) return null
    const marker = b[i + 1]
    const len = b.readUInt16BE(i + 2)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]
    i += 2 + len
  }
  return null
}

const readers = { '.webp': webpSize, '.png': pngSize, '.jpg': jpegSize, '.jpeg': jpegSize }

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const sizes = {}
for (const file of walk(join(pub, 'media')).sort()) {
  const read = readers[extname(file).toLowerCase()]
  if (!read) continue
  const size = read(readFileSync(file))
  if (!size) throw new Error(`could not read image size: ${file}`)
  sizes['/' + relative(pub, file).split(sep).join('/')] = size
}
const lines = Object.entries(sizes).map(([k, [w, h]]) => `  ${JSON.stringify(k)}: [${w}, ${h}]`)
writeFileSync(out, '{\n' + lines.join(',\n') + '\n}\n')
console.log(`image-sizes: ${Object.keys(sizes).length} images -> ${relative(root, out)}`)
