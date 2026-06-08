const id = 'classic-weekly-rank'
const label = 'Classic Weekly Rank'
const order = 20
const sizes = {
  small: {
    id: 'small',
    width: 320,
    height: 460,
    radius: 24,
    mode: 'vertical',
  },
  medium: {
    id: 'medium',
    width: 620,
    height: 220,
    radius: 24,
    mode: 'horizontal',
  },
  large: {
    id: 'large',
    width: 960,
    height: 260,
    radius: 26,
    mode: 'dashboard',
  },
}

const variants = {
  dark: {
    id: 'dark',
    label: 'Aurora Dark',
    background: '#090018',
    border: '#4b2386',
    panel: '#12072b',
    panelBorder: '#372066',
    divider: '#2b174f',
    text: '#fff8ff',
    muted: '#b79cff',
    subtle: '#00d9ff',
    accent: '#ff67c8',
    accent2: '#18d5ff',
    accent3: '#9b7cff',
    glow: '#ff4fbd',
    shadow: '#05000d',
    band: '#171433',
    band2: '#221444',
    waveform: ['#25d7ff', '#7c8cff', '#ff6bc8'],
  },
  light: {
    id: 'light',
    label: 'Sakura Light',
    background: '#fff1f8',
    border: '#ffc5dd',
    panel: '#fffafd',
    panelBorder: '#ffc8df',
    divider: '#ffd6e7',
    text: '#261126',
    muted: '#9b5a79',
    subtle: '#da2d86',
    accent: '#e93487',
    accent2: '#ffd14f',
    accent3: '#c7a4ff',
    glow: '#ff8fad',
    shadow: '#f7cada',
    band: '#ffe8f2',
    band2: '#fff7fb',
    waveform: ['#ff9caf', '#ff7fa4', '#ffd052'],
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

function linearGradient(gradientId, colors, x1 = '0%', y1 = '0%', x2 = '100%', y2 = '0%') {
  const stops = colors
    .map((color, index) => {
      const offset = colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100
      return `<stop offset="${offset}%" stop-color="${color}" />`
    })
    .join('')
  return `<linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
}

function coverHref(song) {
  const href = song.coverDataUri64 || song.coverDataUri || song.coverUrl || ''
  return href.startsWith('http://') ? href.replace('http://', 'https://') : href
}

function renderDefs({ theme, id: renderId, size }) {
  return `
    <defs>
      ${linearGradient(`bg-${renderId}`, [theme.background, theme.band, theme.background])}
      ${linearGradient(`ring-${renderId}`, [theme.accent2, theme.accent3, theme.accent])}
      ${linearGradient(`shine-${renderId}`, ['transparent', theme.glow, 'transparent'])}
      <filter id="shadow-${renderId}" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${theme.shadow}" flood-opacity="0.34" />
      </filter>
      <clipPath id="card-clip-${renderId}">
        <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}" rx="${size.radius}" />
      </clipPath>
    </defs>
  `
}

function renderBackground({ theme, size, id: renderId }) {
  const shineX = -Math.round(size.width * 0.72)
  const shineY = -Math.round(size.height * 0.25)
  const shineWidth = Math.round(size.width * 0.46)
  const shineHeight = Math.round(size.height * 1.55)
  const shineEndX = Math.round(size.width + size.height * 0.58)

  return `
    <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}" rx="${size.radius}" fill="url(#bg-${renderId})" stroke="${theme.border}" />
    <g clip-path="url(#card-clip-${renderId})">
      <path d="M ${Math.round(size.width * 0.62)} -10 L ${Math.round(size.width * 0.78)} ${size.height + 12} L ${size.width + 24} ${size.height + 12} L ${Math.round(size.width * 0.88)} -10 Z" fill="${theme.band2}" opacity="0.32" />
      <rect x="${shineX}" y="${shineY}" width="${shineWidth}" height="${shineHeight}" fill="url(#shine-${renderId})" opacity="0.18" transform="skewX(-18)">
        <animate attributeName="x" values="${shineX};${shineEndX}" dur="9s" repeatCount="indefinite" />
      </rect>
    </g>
  `
}

function renderCover({ song, theme, id: renderId, x, y, size }) {
  const href = coverHref(song)
  const clipId = `cover-clip-${renderId}-${Math.round(x)}-${Math.round(y)}`
  const fallback = `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="${theme.panel}" stroke="${theme.panelBorder}" />
    <circle cx="${x + size * 0.5}" cy="${y + size * 0.46}" r="${size * 0.24}" fill="url(#ring-${renderId})" opacity="0.9" />
    <circle cx="${x + size * 0.5}" cy="${y + size * 0.46}" r="${size * 0.08}" fill="${theme.background}" />
    <text x="${x + size * 0.5}" y="${y + size * 0.75}" text-anchor="middle" font-size="${Math.max(12, size * 0.08)}" fill="${theme.muted}" font-weight="700">NCM</text>
  `

  if (!href) return fallback

  return `
    <g filter="url(#shadow-${renderId})">
      <clipPath id="${clipId}">
        <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" />
      </clipPath>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="${theme.panel}" />
      <image href="${escapeXml(href)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="url(#shine-${renderId})" opacity="0.16">
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="4.8s" repeatCount="indefinite" />
      </rect>
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${Math.round(size * 0.12)}" fill="none" stroke="${theme.panelBorder}" opacity="0.9" />
    </g>
  `
}

function renderWeekRing({ result, theme, id: renderId, x, y, size }) {
  const week = result.week || {}
  const percent = Math.max(0, Math.min(1, Number(week.percent || 0)))
  const center = size / 2
  const radius = size / 2 - 12
  const circumference = 2 * Math.PI * radius
  const dash = circumference * percent
  const rest = circumference - dash
  const label = week.label || '0m'

  return `
    <g transform="translate(${x} ${y})">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${theme.panel}" stroke="${theme.divider}" stroke-width="13" opacity="0.9" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="url(#ring-${renderId})" stroke-width="13" stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${rest.toFixed(2)}" transform="rotate(-90 ${center} ${center})" />
      <text x="${center}" y="${center - 4}" text-anchor="middle" font-size="${Math.max(18, size * 0.16)}" fill="${theme.text}" font-weight="900">${escapeXml(label)}</text>
      <text x="${center}" y="${center + 24}" text-anchor="middle" font-size="${Math.max(10, size * 0.075)}" fill="${theme.subtle}" font-weight="800" letter-spacing="1.2" opacity="0.82">THIS WEEK</text>
    </g>
  `
}

function chunkItems(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function renderRankRow({
  item,
  theme,
  id: renderId,
  x,
  y,
  width,
  height,
  coverSize,
  titleSize,
  metaSize,
  textMaxWidth,
  delay = 0,
  cycle = 0,
  pageEnd = 0,
  compact = false,
  compactLineGap = 4,
  centerStacked = false,
  rankSize = compact ? 9 : 11,
}) {
  const song = item.song || {}
  const rankText = `#${item.rank}`
  const layout = compact ? 'inline' : 'stacked'
  const titleFontSize = titleSize
  const albumFontSize = Math.max(9, metaSize - 1)
  const compactCoverY = y + Math.round((height - coverSize) / 2)
  const compactTitleY = compactCoverY + Math.round(coverSize * 0.43)
  const stackedCoverY = y + Math.round((height - coverSize) / 2)
  const stackedCoverCenter = stackedCoverY + coverSize / 2
  const stackedFirstLineOffset = ((metaSize + 5) + (albumFontSize + 5) + albumFontSize * 0.18 - titleFontSize * 0.82) / 2
  const stackedTitleY = centerStacked ? Math.round(stackedCoverCenter - stackedFirstLineOffset) : y + titleFontSize
  const titleY = layout === 'inline' ? compactTitleY : stackedTitleY
  const artistY = titleY + metaSize + 5
  const albumY = layout === 'inline'
    ? titleY + albumFontSize + compactLineGap
    : artistY + albumFontSize + 5
  const textTop = Math.round(titleY - titleFontSize * 0.82)
  const textBottom = Math.round(albumY + albumFontSize * 0.18)
  const alignedCoverY = compact ? compactCoverY : centerStacked ? stackedCoverY : textTop
  const alignedCoverSize = compact || centerStacked ? coverSize : Math.max(coverSize, textBottom - textTop)
  const textX = x + alignedCoverSize + (compact ? 14 : 12)
  const availableTextWidth = width - alignedCoverSize - (compact ? 82 : 66)
  const textWidth = Math.min(availableTextWidth, textMaxWidth || availableTextWidth)
  const rawTitle = song.name || 'Unknown'
  const rawArtist = song.artists || 'Unknown artist'
  const artistWidth = compact ? Math.min(Math.round(textWidth * 0.34), estimateTextWidth(rawArtist, metaSize)) : textWidth
  const titleMaxWidth = compact ? Math.max(80, textWidth - artistWidth - 12) : textWidth
  const title = truncateToWidth(rawTitle, titleSize, titleMaxWidth)
  const titleActualWidth = estimateTextWidth(title, titleSize)
  const compactArtistX = textX + titleActualWidth + 12
  const compactArtistWidth = Math.max(0, textWidth - titleActualWidth - 12)
  const artist = truncateToWidth(rawArtist, metaSize, textWidth)
  const inlineArtist = compactArtistWidth >= 28 ? truncateToWidth(rawArtist, metaSize, compactArtistWidth) : ''
  const album = truncateToWidth(song.album || 'Unknown album', albumFontSize, textWidth)
  const rankY = titleY
  const animationBegin = `${delay.toFixed(2)}s`
  const rowAnimation = cycle > 0
    ? {
        keyTimes: [
          0,
          Math.max(0.001, delay / cycle),
          Math.min(0.98, (delay + 0.55) / cycle),
          Math.min(0.99, Math.max(delay + 0.55, pageEnd - 0.18) / cycle),
          Math.min(0.995, pageEnd / cycle),
          1,
        ].join(';'),
        opacityValues: '0;0;1;1;0;0',
        transformValues: '0 8;0 8;0 0;0 0;0 0;0 8',
      }
    : null

  return `
    <g opacity="0" transform="translate(0 8)">
      ${rowAnimation
        ? `<animate attributeName="opacity" values="${rowAnimation.opacityValues}" keyTimes="${rowAnimation.keyTimes}" dur="${cycle}s" repeatCount="indefinite" />
           <animateTransform attributeName="transform" type="translate" values="${rowAnimation.transformValues}" keyTimes="${rowAnimation.keyTimes}" dur="${cycle}s" repeatCount="indefinite" />`
        : `<animate attributeName="opacity" values="0;1" dur="0.55s" begin="${animationBegin}" fill="freeze" />
           <animateTransform attributeName="transform" type="translate" values="0 8;0 0" dur="0.55s" begin="${animationBegin}" fill="freeze" />`}
      ${renderCover({ song, theme, id: renderId, x, y: alignedCoverY, size: alignedCoverSize })}
      <text x="${textX}" y="${titleY}" text-anchor="start" font-size="${titleSize}" fill="${theme.text}" font-weight="900">${escapeXml(title)}</text>
      ${compact
        ? inlineArtist ? `<text x="${compactArtistX}" y="${titleY}" font-size="${metaSize}" fill="${theme.accent}" font-weight="800">${escapeXml(inlineArtist)}</text>` : ''
        : `<text x="${textX}" y="${artistY}" text-anchor="start" font-size="${metaSize}" fill="${theme.accent}" font-weight="800">${escapeXml(artist)}</text>`}
      <text x="${textX}" y="${albumY}" text-anchor="start" font-size="${albumFontSize}" fill="${theme.muted}" font-weight="600" opacity="0.88">${escapeXml(album)}</text>
      <text x="${x + width}" y="${rankY}" text-anchor="end" font-size="${rankSize}" fill="${theme.subtle}" font-weight="900" letter-spacing="0.8">${rankText}</text>
    </g>
  `
}

function renderPagedRankRows({
  rank,
  theme,
  id: renderId,
  x,
  y,
  width,
  rowHeight,
  gap,
  coverSize,
  titleSize,
  metaSize,
  textMaxWidth,
  compact = false,
  compactLineGap = 4,
  centerStacked = false,
  pageDuration = 10,
  rankSize,
}) {
  const pages = chunkItems((rank?.songs || []).slice(0, 20), 5)
  const pageCount = pages.length
  if (!pageCount) {
    return `<text x="${x}" y="${y + 24}" font-size="${titleSize}" fill="${theme.text}" font-weight="900">No weekly records</text>`
  }

  const cycle = pageCount * pageDuration

  return pages
    .map((page, pageIndex) => {
      const pageBegin = pageIndex * pageDuration
      const pageEnd = pageBegin + pageDuration
      const pageAnimation = pageCount > 1
        ? `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.04;${((pageDuration - 0.35) / cycle).toFixed(3)};${(pageDuration / cycle).toFixed(3)};1" dur="${cycle}s" begin="${pageBegin}s" repeatCount="indefinite" />`
        : ''

      return `
        <g opacity="${pageIndex === 0 ? 1 : 0}">
          ${pageAnimation}
          ${page.map((item, index) => renderRankRow({
            item,
            theme,
            id: renderId,
            x,
            y: y + index * (rowHeight + gap),
            width,
            height: rowHeight,
            coverSize,
            titleSize,
            metaSize,
            textMaxWidth,
            compactLineGap,
            centerStacked,
            rankSize,
            delay: pageCount > 1 ? pageBegin + index * 0.16 : index * 0.16,
            cycle: pageCount > 1 ? cycle : 0,
            pageEnd,
            compact,
          })).join('')}
        </g>
      `
    })
    .join('')
}

function rankData(result) {
  return result.weeklyRank || {
    songs: [],
    week: result.week,
  }
}

function renderLargeCard({ theme, size, result, renderId }) {
  const rank = rankData(result)

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music weekly rank">
      ${renderDefs({ theme, id: renderId, size })}
      ${renderBackground({ theme, size, id: renderId })}
      <text x="34" y="27" font-size="13" fill="${theme.subtle}" font-weight="900" letter-spacing="1.2">WEEKLY TOP PLAYS</text>
      ${renderPagedRankRows({
        rank,
        theme,
        id: renderId,
        x: 34,
        y: 36,
        width: 660,
        rowHeight: 38,
        gap: 5,
        coverSize: 36,
        titleSize: 15,
        metaSize: 12,
        textMaxWidth: 500,
        compactLineGap: 8,
        compact: true,
        rankSize: 13,
      })}
      ${renderWeekRing({ result: { ...result, week: rank.week || result.week }, theme, id: renderId, x: 752, y: 55, size: 150 })}
    </svg>
  `
}

function renderMediumCard({ theme, size, result, renderId }) {
  const rank = rankData(result)

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music weekly rank">
      ${renderDefs({ theme, id: renderId, size })}
      ${renderBackground({ theme, size, id: renderId })}
      <text x="28" y="24" font-size="12" fill="${theme.subtle}" font-weight="900" letter-spacing="1.2">WEEKLY TOP PLAYS</text>
      ${renderPagedRankRows({
        rank,
        theme,
        id: renderId,
        x: 28,
        y: 32,
        width: 560,
        rowHeight: 34,
        gap: 2,
        coverSize: 30,
        titleSize: 13,
        metaSize: 11,
        textMaxWidth: 405,
        compactLineGap: 4,
        compact: true,
        rankSize: 12,
      })}
    </svg>
  `
}

function renderSmallCard({ theme, size, result, renderId }) {
  const rank = rankData(result)

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music weekly rank">
      ${renderDefs({ theme, id: renderId, size })}
      ${renderBackground({ theme, size, id: renderId })}
      <text x="24" y="34" font-size="12" fill="${theme.subtle}" font-weight="900" letter-spacing="1.2">WEEKLY TOP PLAYS</text>
      ${renderPagedRankRows({
        rank,
        theme,
        id: renderId,
        x: 24,
        y: 52,
        width: 272,
        rowHeight: 76,
        gap: 5,
        coverSize: 62,
        titleSize: 14,
        metaSize: 11,
        textMaxWidth: 172,
        centerStacked: true,
        compact: false,
      })}
    </svg>
  `
}

function renderCard({ variant, size, result }) {
  const theme = typeof variant === 'string' ? variants[variant] : variant
  if (!theme) throw new Error(`Unknown classic-weekly-rank card variant: ${variant}`)

  const renderId = `${id}-${theme.id}-${size.id}`.replace(/[^a-z0-9-]/gi, '-')
  const renderers = {
    dashboard: renderLargeCard,
    horizontal: renderMediumCard,
    vertical: renderSmallCard,
  }
  const svg = renderers[size.mode]({ theme, size, result, renderId })

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
