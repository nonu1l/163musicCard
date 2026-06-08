const id = 'github'
const label = 'GitHub'
const order = 50

const sizes = {
  large: {
    id: 'large',
    width: 960,
    height: 260,
    radius: 8,
    mode: 'dashboard',
  },
}

const variants = {
  dark: {
    id: 'dark',
    label: 'GitHub Dark',
    canvas: '#0d1117',
    surface: '#161b22',
    surfaceAlt: '#0d1117',
    border: '#30363d',
    divider: '#21262d',
    text: '#f0f6fc',
    muted: '#8b949e',
    subtle: '#6e7681',
    accent: '#2f81f7',
    badge: '#1f6feb',
    badgeText: '#c9d1d9',
    shadow: '#010409',
  },
  light: {
    id: 'light',
    label: 'GitHub Light',
    canvas: '#ffffff',
    surface: '#f6f8fa',
    surfaceAlt: '#ffffff',
    border: '#d0d7de',
    divider: '#d8dee4',
    text: '#24292f',
    muted: '#57606a',
    subtle: '#6e7781',
    accent: '#0969da',
    badge: '#0969da',
    badgeText: '#24292f',
    shadow: '#8c959f',
  },
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function estimateTextWidth(value, fontSize) {
  return Array.from(String(value || '')).reduce((width, char) => {
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(char)) return width + fontSize
    if (/\s/.test(char)) return width + fontSize * 0.34
    if (/[A-Z0-9]/.test(char)) return width + fontSize * 0.64
    if (/[il.,'`]/.test(char)) return width + fontSize * 0.3
    if (/[mwMW]/.test(char)) return width + fontSize * 0.86
    return width + fontSize * 0.56
  }, 0)
}

function truncateToWidth(value, fontSize, maxWidth) {
  const text = String(value || '')
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text

  const ellipsis = '...'
  let result = ''
  for (const char of Array.from(text)) {
    const next = `${result}${char}`
    if (estimateTextWidth(`${next}${ellipsis}`, fontSize) > maxWidth) break
    result = next
  }

  return result ? `${result}${ellipsis}` : ellipsis
}

function formatNumber(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return '0'
  return number.toLocaleString('en-US')
}

function coverHref(song) {
  const href = song.coverDataUri || song.coverUrl || ''
  return href.startsWith('http://') ? href.replace('http://', 'https://') : href
}

function chunkItems(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function rankData(result) {
  return result.weeklyRank || {
    songs: [],
    week: result.week,
  }
}

function renderDefs({ theme, renderId }) {
  return `
    <defs>
      <filter id="shadow-${renderId}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="${theme.shadow}" flood-opacity="0.12" />
      </filter>
      <clipPath id="cover-clip-${renderId}">
        <rect x="0" y="0" width="26" height="26" rx="5" />
      </clipPath>
    </defs>
  `
}

function renderCover({ song, theme, renderId, x, y, size }) {
  const href = coverHref(song)

  if (!href) {
    return `
      <g transform="translate(${x} ${y})">
        <rect width="${size}" height="${size}" rx="6" fill="${theme.surface}" stroke="${theme.border}" />
        <circle cx="${size / 2}" cy="${size / 2}" r="${Math.round(size * 0.26)}" fill="${theme.accent}" opacity="0.18" />
      </g>
    `
  }

  return `
    <g transform="translate(${x} ${y})">
      <rect width="${size}" height="${size}" rx="6" fill="${theme.surface}" />
      <image href="${escapeXml(href)}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cover-clip-${renderId})" />
      <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" rx="5.5" fill="none" stroke="${theme.border}" />
    </g>
  `
}

function renderRankBadge({ theme, rank, x, y }) {
  return `
    <g transform="translate(${x} ${y})">
      <text x="0" y="0" font-size="12" fill="${theme.subtle}" font-weight="800">#${rank}</text>
    </g>
  `
}

function renderRankRow({
  item,
  theme,
  renderId,
  x,
  y,
  width,
  rowHeight,
  delay,
  cycle,
  pageEnd,
}) {
  const song = item.song || {}
  const title = truncateToWidth(song.name || 'Unknown', 13, 170)
  const titleWidth = estimateTextWidth(title, 13)
  const artists = truncateToWidth(song.artists || 'Unknown artist', 12, Math.max(62, 252 - titleWidth))
  const album = truncateToWidth(song.album || 'Unknown album', 12, 158)
  const playCount = Number(item.playCount || 0)
  const animation = cycle > 0
    ? {
        keyTimes: [
          0,
          Math.max(0.001, delay / cycle),
          Math.min(0.98, (delay + 0.5) / cycle),
          Math.min(0.99, Math.max(delay + 0.5, pageEnd - 0.18) / cycle),
          Math.min(0.995, pageEnd / cycle),
          1,
        ].join(';'),
        opacityValues: '0;0;1;1;0;0',
        transformValues: '0 6;0 6;0 0;0 0;0 0;0 6',
      }
    : null

  return `
    <g opacity="0" transform="translate(0 6)">
      ${animation
        ? `<animate attributeName="opacity" values="${animation.opacityValues}" keyTimes="${animation.keyTimes}" dur="${cycle}s" repeatCount="indefinite" />
           <animateTransform attributeName="transform" type="translate" values="${animation.transformValues}" keyTimes="${animation.keyTimes}" dur="${cycle}s" repeatCount="indefinite" />`
        : `<animate attributeName="opacity" values="0;1" dur="0.5s" begin="${delay.toFixed(2)}s" fill="freeze" />
           <animateTransform attributeName="transform" type="translate" values="0 6;0 0" dur="0.5s" begin="${delay.toFixed(2)}s" fill="freeze" />`}
      <rect x="${x}" y="${y}" width="${width}" height="${rowHeight}" rx="0" fill="${theme.surfaceAlt}" />
      <line x1="${x}" y1="${y + rowHeight}" x2="${x + width}" y2="${y + rowHeight}" stroke="${theme.divider}" />
      ${renderRankBadge({ theme, rank: item.rank, x: x + 18, y: y + 22 })}
      ${renderCover({ song, theme, renderId, x: x + 54, y: y + 4, size: 26 })}
      <text x="${x + 94}" y="${y + 22}" font-size="13" fill="${theme.text}" font-weight="700">
        ${escapeXml(title)}
        <tspan dx="10" font-size="12" fill="${theme.accent}" font-weight="700">${escapeXml(artists)}</tspan>
      </text>
      <text x="${x + 386}" y="${y + 22}" font-size="12" fill="${theme.muted}" font-weight="600">${escapeXml(album)}</text>
      <text x="${x + width - 22}" y="${y + 22}" text-anchor="end" font-size="11" fill="${theme.subtle}" font-weight="700">${formatNumber(playCount)} plays</text>
    </g>
  `
}

function renderPagedRows({ rank, theme, renderId, x, y, width }) {
  const pages = chunkItems((rank.songs || []).slice(0, 20), 5)
  const pageCount = pages.length
  const rowHeight = 34
  const pageDuration = 10

  if (!pageCount) {
    return `
      <rect x="${x}" y="${y}" width="${width}" height="${rowHeight * 5}" rx="0" fill="${theme.surfaceAlt}" />
      <text x="${x + 22}" y="${y + 42}" font-size="17" fill="${theme.text}" font-weight="800">No weekly records</text>
      <text x="${x + 22}" y="${y + 68}" font-size="13" fill="${theme.muted}" font-weight="600">Run the generator after listening data is available.</text>
    `
  }

  const cycle = pageCount * pageDuration

  return pages
    .map((page, pageIndex) => {
      const pageBegin = pageIndex * pageDuration
      const pageEnd = pageBegin + pageDuration
      const pageAnimation = pageCount > 1
        ? `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.035;${((pageDuration - 0.35) / cycle).toFixed(3)};${(pageDuration / cycle).toFixed(3)};1" dur="${cycle}s" begin="${pageBegin}s" repeatCount="indefinite" />`
        : ''

      return `
        <g opacity="${pageIndex === 0 ? 1 : 0}">
          ${pageAnimation}
          ${page.map((item, index) => renderRankRow({
            item,
            theme,
            renderId,
            x,
            y: y + index * rowHeight,
            width,
            rowHeight,
            delay: pageCount > 1 ? pageBegin + index * 0.14 : index * 0.14,
            cycle: pageCount > 1 ? cycle : 0,
            pageEnd,
          })).join('')}
        </g>
      `
    })
    .join('')
}

function renderWeekPanel({ theme, rank, x, y }) {
  const week = rank.week || {}
  const label = week.label || '0m'
  const totalSongs = rank.songs?.length || 0
  const topPlayCount = rank.songs?.[0]?.playCount || 0

  return `
    <g transform="translate(${x} ${y})">
      <rect width="224" height="212" rx="8" fill="${theme.surfaceAlt}" stroke="${theme.border}" />
      <text x="18" y="30" font-size="12" fill="${theme.muted}" font-weight="800" letter-spacing="1">THIS WEEK</text>
      <text x="18" y="72" font-size="32" fill="${theme.text}" font-weight="800">${escapeXml(label)}</text>
      <text x="18" y="99" font-size="13" fill="${theme.muted}" font-weight="600">weekly listening time</text>
      <line x1="18" y1="122" x2="206" y2="122" stroke="${theme.divider}" />
      <text x="18" y="151" font-size="13" fill="${theme.muted}" font-weight="700">Tracks</text>
      <text x="206" y="151" text-anchor="end" font-size="17" fill="${theme.text}" font-weight="800">${formatNumber(totalSongs)}</text>
      <text x="18" y="179" font-size="13" fill="${theme.muted}" font-weight="700">Top plays</text>
      <text x="206" y="179" text-anchor="end" font-size="17" fill="${theme.text}" font-weight="800">${formatNumber(topPlayCount)}</text>
    </g>
  `
}

function renderLargeCard({ theme, size, result, renderId }) {
  const rank = rankData(result)

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music weekly rank GitHub style card">
      ${renderDefs({ theme, renderId })}
      <rect x="0.5" y="0.5" width="${size.width - 1}" height="${size.height - 1}" rx="${size.radius}" fill="${theme.canvas}" stroke="${theme.border}" />
      <rect x="24" y="24" width="650" height="212" rx="8" fill="${theme.surfaceAlt}" stroke="${theme.border}" />
      <g transform="translate(24 24)">
        <rect width="650" height="42" rx="8" fill="${theme.surface}" />
        <line x1="0" y1="42" x2="650" y2="42" stroke="${theme.border}" />
        <text x="20" y="27" font-size="13" fill="${theme.text}" font-weight="800">Weekly top plays</text>
        <text x="506" y="27" font-size="12" fill="${theme.muted}" font-weight="700">NetEase Cloud Music</text>
      </g>
      ${renderPagedRows({ rank, theme, renderId, x: 24, y: 66, width: 650 })}
      ${renderWeekPanel({ theme, rank, x: 712, y: 24 })}
    </svg>
  `
}

function renderCard({ variant, size, result }) {
  const theme = typeof variant === 'string' ? variants[variant] : variant
  if (!theme) throw new Error(`Unknown github card variant: ${variant}`)
  if (size.id !== 'large') throw new Error('GitHub card only supports large size.')

  const renderId = `${id}-${theme.id}-${size.id}`.replace(/[^a-z0-9-]/gi, '-')
  const svg = renderLargeCard({ theme, size, result, renderId })

  return svg
    .replace(/>\s+</g, '><')
    .trim()
}

module.exports = {
  id,
  label,
  order,
  renderCard,
  sizes,
  variants,
}
