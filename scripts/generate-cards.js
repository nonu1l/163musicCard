const fs = require('fs')
const path = require('path')
const {
  buildListeningState,
  getRecentSongs,
  getWeeklyRank,
} = require('./music')

const root = path.resolve(__dirname, '..')
const cardDir = path.join(__dirname, 'cards')
const outputDir = path.join(root, 'cards')
const dataDir = path.join(root, 'data')
const listeningStatePath = path.join(dataDir, 'listening-state.json')

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

async function embedCover(song, cache) {
  if (!song?.coverUrl) return
  if (!cache.has(song.coverUrl)) {
    cache.set(song.coverUrl, await fetchCoverDataUri(song.coverUrl))
  }
  song.coverDataUri = cache.get(song.coverUrl)
}

function loadCardDesigns() {
  if (!fs.existsSync(cardDir)) return []

  return fs
    .readdirSync(cardDir)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => {
      const cardPath = path.join(cardDir, file)
      delete require.cache[require.resolve(cardPath)]
      const card = require(cardPath)
      return {
        ...card,
        id: card.id || path.basename(file, '.js'),
      }
    })
}

async function main() {
  const cards = loadCardDesigns()
  if (!cards.length) {
    throw new Error('No card design files found in scripts/cards/.')
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const maxLimit = Number(process.env.MUSIC_LIMIT || 5)
  const rankLimit = Number(process.env.RANK_LIMIT || 20)
  const recentResult = await getRecentSongs({ limit: maxLimit })
  const weeklyRank = await getWeeklyRank({ limit: rankLimit })
  const listeningState = buildListeningState(recentResult)
  const coverCache = new Map()

  if (recentResult.songs?.[0]) {
    await embedCover(recentResult.songs[0], coverCache)
  }
  for (const item of weeklyRank.songs || []) {
    await embedCover(item.song, coverCache)
  }

  const result = {
    ...recentResult,
    listeningState,
    weeklyRank,
  }

  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(
    listeningStatePath,
    JSON.stringify(
      {
        ...listeningState,
        latestSong: recentResult.songs?.[0]
          ? {
              id: recentResult.songs[0].id,
              name: recentResult.songs[0].name,
              artists: recentResult.songs[0].artists,
              album: recentResult.songs[0].album,
            }
          : null,
      },
      null,
      2
    ) + '\n',
    'utf8'
  )

  for (const card of cards) {
    const cardOutputDir = path.join(outputDir, card.id)
    fs.mkdirSync(cardOutputDir, { recursive: true })

    for (const variant of Object.values(card.variants)) {
      for (const size of Object.values(card.sizes)) {
        const svg = card.renderCard({ variant, size, result })
        const filename = `${variant.id}-${size.id}.svg`
        fs.writeFileSync(path.join(cardOutputDir, filename), svg, 'utf8')
        console.log(`Generated cards/${card.id}/${filename}`)
      }
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error)
  process.exit(1)
})
