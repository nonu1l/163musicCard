const fs = require('fs')
const path = require('path')
const { getRecentSongs } = require('./music')
const { renderCard, sizes } = require('./svg-card')

const root = path.resolve(__dirname, '..')
const themeDir = path.join(root, 'themes')
const outputDir = path.join(root, 'cards')

function normalizeImageUrl(url) {
  if (!url) return ''
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url
}

async function fetchCoverDataUri(url) {
  const normalized = normalizeImageUrl(url)
  if (!normalized || typeof fetch !== 'function') return ''

  try {
    const response = await fetch(`${normalized}?param=512y512`)
    if (!response.ok) return ''

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return ''
  }
}

function loadThemes() {
  if (!fs.existsSync(themeDir)) return []

  return fs
    .readdirSync(themeDir)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => {
      const themePath = path.join(themeDir, file)
      delete require.cache[require.resolve(themePath)]
      const theme = require(themePath)
      return {
        ...theme,
        id: theme.id || path.basename(file, '.js'),
      }
    })
}

async function main() {
  const themes = loadThemes()
  if (!themes.length) {
    throw new Error('No theme files found in themes/.')
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const maxLimit = Number(process.env.MUSIC_LIMIT || 5)
  const result = await getRecentSongs({ limit: maxLimit })
  if (result.songs?.[0]?.coverUrl) {
    result.songs[0].coverDataUri = await fetchCoverDataUri(result.songs[0].coverUrl)
  }

  for (const theme of themes) {
    for (const size of Object.values(sizes)) {
      const svg = renderCard({ theme, size, result })
      const filename = `netease-${theme.id}-${size.id}.svg`
      fs.writeFileSync(path.join(outputDir, filename), svg, 'utf8')
      console.log(`Generated cards/${filename}`)
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error)
  process.exit(1)
})
