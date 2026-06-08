const id = 'apple-music'
const label = 'Apple Music'
const order = 40

const sizes = {
  small: {
    id: 'small',
    width: 320,
    height: 460,
    radius: 28,
    mode: 'vertical',
  },
  medium: {
    id: 'medium',
    width: 620,
    height: 220,
    radius: 28,
    mode: 'horizontal',
  },
  large: {
    id: 'large',
    width: 960,
    height: 260,
    radius: 30,
    mode: 'dashboard',
  },
}

const variants = {
  light: {
    id: 'light',
    label: 'Apple Music Light',
    canvas: '#f5f5f7',
    surface: '#ffffff',
    surfaceAlt: '#fbfbfd',
    border: '#d9d9df',
    divider: '#ececf0',
    text: '#1d1d1f',
    secondary: '#515154',
    muted: '#6e6e73',
    tertiary: '#86868b',
    accent: '#fa2d55',
    accent2: '#ff375f',
    accent3: '#ff7a1a',
    shadow: '#b8b8bf',
    glow: '#ff2d55',
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

function fitFontSize(value, maxWidth, preferred, minimum) {
  let size = preferred
  while (size > minimum && estimateTextWidth(value, size) > maxWidth) {
    size -= 1
  }
  return size
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

function radialGradient(gradientId, colors) {
  const stops = colors
    .map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}" />`)
    .join('')
  return `<radialGradient id="${gradientId}" cx="50%" cy="50%" r="55%">${stops}</radialGradient>`
}

function latestSong(result) {
  return result.songs?.[0] || {
    name: 'No recent song',
    artists: 'Unknown artist',
    album: 'Unknown album',
  }
}

function coverHref(song) {
  const href = song.coverDataUri || song.coverUrl || ''
  return href.startsWith('http://') ? href.replace('http://', 'https://') : href
}

function normalizedAlias(song) {
  const alias = String(song.alias || '').trim().replace(/^\((.*)\)$/, '$1').trim()
  const name = String(song.name || '')
  if (!alias) return ''
  if (name.toLowerCase().includes(alias.toLowerCase())) return ''
  return alias
}

function titleText(song) {
  const name = song.name || 'Unknown'
  const alias = normalizedAlias(song)
  return alias ? `${name} (${alias})` : name
}

function renderDefs({ theme, id: renderId, size }) {
  return `
    <defs>
      ${linearGradient(`music-${renderId}`, [theme.accent, theme.accent2, theme.accent3], '0%', '0%', '100%', '100%')}
      ${linearGradient(`soft-band-${renderId}`, ['#ffffff', '#fff1f5', '#f5f5f7'], '0%', '0%', '100%', '100%')}
      ${radialGradient(`glow-${renderId}`, [
        ['0%', theme.glow, 0.22],
        ['48%', theme.glow, 0.07],
        ['100%', theme.glow, 0],
      ])}
      <filter id="surface-shadow-${renderId}" x="-10%" y="-20%" width="120%" height="150%">
        <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${theme.shadow}" flood-opacity="0.2" />
      </filter>
      <filter id="cover-shadow-${renderId}" x="-18%" y="-18%" width="136%" height="148%">
        <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#1d1d1f" flood-opacity="0.17" />
      </filter>
      <clipPath id="card-clip-${renderId}">
        <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}" rx="${size.radius}" />
      </clipPath>
    </defs>
  `
}

function renderBackground({ theme, size, id: renderId, inset = 14 }) {
  const movingBandTop = inset - 18

  return `
    <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}" rx="${size.radius}" fill="${theme.canvas}" />
    <g clip-path="url(#card-clip-${renderId})">
      <rect x="${inset}" y="${inset}" width="${size.width - inset * 2}" height="${size.height - inset * 2}" rx="${size.radius}" fill="${theme.surface}" filter="url(#surface-shadow-${renderId})" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 42 12; 0 0" dur="16s" repeatCount="indefinite" />
        <circle cx="${Math.round(size.width * 0.04)}" cy="${Math.round(size.height * 0.08)}" r="${Math.round(size.height * 0.64)}" fill="url(#glow-${renderId})" />
        <circle cx="${Math.round(size.width * 0.24)}" cy="${Math.round(size.height * 0.05)}" r="${Math.round(size.height * 0.38)}" fill="${theme.accent}" opacity="0.045" />
      </g>
      <path d="M ${Math.round(size.width * 0.69)} ${inset} C ${Math.round(size.width * 0.79)} ${Math.round(size.height * 0.22)}, ${Math.round(size.width * 0.87)} ${Math.round(size.height * 0.56)}, ${size.width + Math.round(size.width * 0.04)} ${size.height - inset} L ${size.width + Math.round(size.width * 0.16)} ${size.height - inset} L ${size.width + Math.round(size.width * 0.16)} ${inset} Z" fill="url(#soft-band-${renderId})" opacity="0.36" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; -44 8; 0 0" dur="18s" repeatCount="indefinite" />
        <path d="M ${Math.round(size.width * 0.52)} ${movingBandTop} C ${Math.round(size.width * 0.66)} ${Math.round(size.height * 0.27)}, ${Math.round(size.width * 0.78)} ${Math.round(size.height * 0.66)}, ${size.width + Math.round(size.width * 0.04)} ${size.height - inset} L ${size.width + Math.round(size.width * 0.24)} ${size.height - inset} L ${size.width + Math.round(size.width * 0.2)} ${movingBandTop} Z" fill="url(#soft-band-${renderId})" opacity="0.9" />
      </g>
      <rect x="${inset + 0.5}" y="${inset + 0.5}" width="${size.width - inset * 2 - 1}" height="${size.height - inset * 2 - 1}" rx="${size.radius - 1}" fill="none" stroke="${theme.border}" opacity="0.58" />
    </g>
  `
}

function renderCover({ song, theme, id: renderId, x, y, size, radius }) {
  const href = coverHref(song)
  const clipId = `cover-clip-${renderId}-${Math.round(x)}-${Math.round(y)}`
  const fallback = `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="url(#music-${renderId})" />
    <circle cx="${x + size * 0.5}" cy="${y + size * 0.46}" r="${size * 0.22}" fill="#fff" opacity="0.92" />
    <circle cx="${x + size * 0.5}" cy="${y + size * 0.46}" r="${size * 0.075}" fill="${theme.canvas}" />
    <text x="${x + size * 0.5}" y="${y + size * 0.76}" text-anchor="middle" font-size="${Math.max(12, size * 0.08)}" fill="#fff" font-weight="800" opacity="0.92">NCM</text>
  `

  return `
    <g filter="url(#cover-shadow-${renderId})">
      <clipPath id="${clipId}">
        <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" />
      </clipPath>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${theme.surfaceAlt}" />
      ${href
        ? `<image href="${escapeXml(href)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`
        : fallback}
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${radius}" fill="none" stroke="#ffffff" opacity="0.84" />
    </g>
  `
}

function renderLabel({ theme, x, y, text, anchor = 'start', size = 15 }) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${theme.secondary}" font-weight="700">${escapeXml(text)}</text>`
}

function renderTextLine({ text, x, y, width, fontSize, fill, weight, anchor = 'start' }) {
  const value = truncateToWidth(text, fontSize, width)
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fontSize}" fill="${fill}" font-weight="${weight}">${escapeXml(value)}</text>`
}

function renderMarqueeText({ text, x, y, width, fontSize, fill, weight, id: renderId, align = 'start' }) {
  const measuredWidth = Math.ceil(estimateTextWidth(text, fontSize))
  const anchor = align === 'center' ? 'middle' : 'start'

  if (measuredWidth <= width) {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fontSize}" fill="${fill}" font-weight="${weight}">${escapeXml(text)}</text>`
  }

  const left = align === 'center' ? x - width / 2 : x
  const clipId = `marquee-clip-${renderId}-${Math.round(x)}-${Math.round(y)}`
  const gap = Math.max(48, Math.round(width * 0.2))
  const step = measuredWidth + gap
  const duration = Math.max(10, Math.round(step / 34))

  return `
    <clipPath id="${clipId}">
      <rect x="${left}" y="${y - fontSize - 8}" width="${width}" height="${fontSize + 18}" />
    </clipPath>
    <g clip-path="url(#${clipId})">
      <g>
        <animateTransform attributeName="transform" type="translate" from="0 0" to="-${step} 0" dur="${duration}s" repeatCount="indefinite" />
        <text x="${left}" y="${y}" font-size="${fontSize}" fill="${fill}" font-weight="${weight}">${escapeXml(text)}</text>
        <text x="${left + step}" y="${y}" font-size="${fontSize}" fill="${fill}" font-weight="${weight}">${escapeXml(text)}</text>
      </g>
    </g>
  `
}

function renderSongInfo({
  song,
  theme,
  id: renderId,
  x,
  y,
  width,
  titleSize,
  metaSize,
  align = 'start',
  artistOffset = titleSize + 25,
  albumOffset = titleSize + 51,
}) {
  const anchor = align === 'center' ? 'middle' : 'start'
  const title = titleText(song)
  const measuredTitleWidth = estimateTextWidth(title, titleSize)
  const shouldScroll = measuredTitleWidth > width
  const artist = song.artists || 'Unknown artist'
  const album = song.album || 'Unknown album'

  return `
    ${shouldScroll
      ? renderMarqueeText({ text: title, x, y, width, fontSize: titleSize, fill: theme.text, weight: 800, id: renderId, align })
      : renderTextLine({ text: title, x, y, width, fontSize: titleSize, fill: theme.text, weight: 800, anchor })}
    ${renderTextLine({ text: artist, x, y: y + artistOffset, width, fontSize: metaSize, fill: theme.accent, weight: 700, anchor })}
    ${renderTextLine({ text: album, x, y: y + albumOffset, width, fontSize: Math.max(12, metaSize - 1), fill: theme.muted, weight: 500, anchor })}
  `
}

function renderWeekText({ result, theme, x, y, width }) {
  const label = result.week?.label || '0m'
  const timeSize = fitFontSize(label, width, 34, 22)

  return `
    <g>
      <text x="${x + width / 2}" y="${y}" text-anchor="middle" font-size="${timeSize}" fill="${theme.text}" font-weight="850">${escapeXml(label)}</text>
      <text x="${x + width / 2}" y="${y + 32}" text-anchor="middle" font-size="12" fill="${theme.accent}" font-weight="800" letter-spacing="1.1">THIS WEEK</text>
      <text x="${x + width / 2}" y="${y + 55}" text-anchor="middle" font-size="12" fill="${theme.tertiary}" font-weight="600">Listening time</text>
    </g>
  `
}

function renderLargeCard({ theme, size, result, renderId }) {
  const song = latestSong(result)

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Apple Music inspired recent music">
      ${renderDefs({ theme, id: renderId, size })}
      <g font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif">
        ${renderBackground({ theme, size, id: renderId })}
        ${renderCover({ song, theme, id: renderId, x: 42, y: 42, size: 176, radius: 28 })}
        ${renderLabel({ theme, x: 258, y: 62, text: 'Recently Played', size: 16 })}
        ${renderSongInfo({ song, theme, id: renderId, x: 258, y: 116, width: 430, titleSize: 35, metaSize: 17 })}
        ${renderWeekText({ result, theme, x: 748, y: 114, width: 170 })}
      </g>
    </svg>
  `
}

function renderMediumCard({ theme, size, result, renderId }) {
  const song = latestSong(result)

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Apple Music inspired recent music">
      ${renderDefs({ theme, id: renderId, size })}
      <g font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif">
        ${renderBackground({ theme, size, id: renderId, inset: 12 })}
        ${renderCover({ song, theme, id: renderId, x: 34, y: 34, size: 152, radius: 24 })}
        ${renderLabel({ theme, x: 222, y: 55, text: 'Recently Played', size: 15 })}
        ${renderSongInfo({ song, theme, id: renderId, x: 222, y: 112, width: 350, titleSize: 30, metaSize: 15, artistOffset: 47, albumOffset: 69 })}
      </g>
    </svg>
  `
}

function renderSmallCard({ theme, size, result, renderId }) {
  const song = latestSong(result)
  const centerX = size.width / 2

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Apple Music inspired recent music">
      ${renderDefs({ theme, id: renderId, size })}
      <g font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif">
        ${renderBackground({ theme, size, id: renderId, inset: 12 })}
        ${renderCover({ song, theme, id: renderId, x: 36, y: 34, size: 248, radius: 32 })}
        ${renderLabel({ theme, x: centerX, y: 323, text: 'Recently Played', anchor: 'middle', size: 14 })}
        ${renderSongInfo({ song, theme, id: renderId, x: centerX, y: 374, width: 260, titleSize: 23, metaSize: 13, align: 'center', artistOffset: 40, albumOffset: 60 })}
      </g>
    </svg>
  `
}

function renderCard({ variant, size, result }) {
  const theme = typeof variant === 'string' ? variants[variant] : variant
  if (!theme) throw new Error(`Unknown apple-music card variant: ${variant}`)

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
