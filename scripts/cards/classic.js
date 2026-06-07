const id = 'classic'
const label = 'Classic'
const order = 10

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

function renderDefs({ theme, id: renderId, size }) {
  return `
    <defs>
      ${linearGradient(`bg-${renderId}`, [theme.background, theme.band, theme.background])}
      ${linearGradient(`ring-${renderId}`, [theme.accent2, theme.accent3, theme.accent])}
      ${linearGradient(`shine-${renderId}`, ['transparent', theme.glow, 'transparent'])}
      <filter id="shadow-${renderId}" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${theme.shadow}" flood-opacity="0.34" />
      </filter>
      <filter id="soft-glow-${renderId}" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
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

function renderTitleParts({ title, alias, theme }) {
  const safeTitle = escapeXml(title)
  const safeAlias = escapeXml(alias)

  if (!safeAlias) {
    return `<tspan fill="${theme.text}" font-weight="900">${safeTitle}</tspan>`
  }

  return `<tspan fill="${theme.text}" font-weight="900">${safeTitle}</tspan><tspan fill="${theme.muted}" font-weight="700" opacity="0.82"> (${safeAlias})</tspan>`
}

function renderMarqueeTitle({ title, alias, theme, id: renderId, x, y, width, fontSize, align = 'start' }) {
  const left = align === 'center' ? x - width / 2 : x
  const clipId = `title-clip-${renderId}-${Math.round(x)}-${Math.round(y)}`
  const displayTitle = alias ? `${title} (${alias})` : title
  const measuredWidth = Math.ceil(estimateTextWidth(displayTitle, fontSize))
  const textWidth = Math.max(width, measuredWidth)
  const gap = Math.max(46, Math.round(width * 0.2))
  const step = textWidth + gap
  const duration = Math.max(9, Math.round(step / 34))
  const titleParts = renderTitleParts({ title, alias, theme })

  if (measuredWidth <= width) {
    const anchor = align === 'center' ? 'middle' : 'start'
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fontSize}">${titleParts}</text>`
  }

  return `
    <clipPath id="${clipId}">
      <rect x="${left}" y="${y - fontSize - 8}" width="${width}" height="${fontSize + 18}" />
    </clipPath>
    <g clip-path="url(#${clipId})">
      <g>
        <animateTransform attributeName="transform" type="translate" from="0 0" to="-${step} 0" dur="${duration}s" repeatCount="indefinite" />
        <text x="${left}" y="${y}" font-size="${fontSize}">${titleParts}</text>
        <text x="${left + step}" y="${y}" font-size="${fontSize}">${titleParts}</text>
      </g>
    </g>
  `
}

function renderSongInfo({ song, theme, id: renderId, x, y, width, titleSize, metaSize, align = 'start' }) {
  const anchor = align === 'center' ? 'middle' : 'start'
  const title = song.name || 'Unknown'
  const alias = song.alias || ''
  const albumSize = Math.max(11, metaSize - 1)
  const artistText = truncateToWidth(song.artists || 'Unknown artist', metaSize, width)
  const albumText = truncateToWidth(song.album || 'Unknown album', albumSize, width)

  return `
    ${renderMarqueeTitle({ title, alias, theme, id: renderId, x, y, width, fontSize: titleSize, align })}
    <text x="${x}" y="${y + titleSize + 22}" text-anchor="${anchor}" font-size="${metaSize}" fill="${theme.accent}" font-weight="800">${escapeXml(artistText)}</text>
    <text x="${x}" y="${y + titleSize + 48}" text-anchor="${anchor}" font-size="${albumSize}" fill="${theme.muted}" font-weight="500" opacity="0.86">${escapeXml(albumText)}</text>
  `
}

function renderEqualizer({ theme, x, y, width, height }) {
  const bars = [0.35, 0.68, 0.48, 0.85, 0.42, 0.62, 0.32, 0.76]
  const gap = width / bars.length

  return bars
    .map((value, index) => {
      const barHeight = Math.max(8, value * height)
      const initialHeight = barHeight * 0.52
      const bx = x + index * gap
      const delay = (index * 0.17).toFixed(2)
      const color = theme.waveform[index % theme.waveform.length]
      return `
        <rect x="${bx.toFixed(1)}" y="${(y + height - initialHeight).toFixed(1)}" width="${Math.max(4, gap * 0.42).toFixed(1)}" height="${initialHeight.toFixed(1)}" rx="3" fill="${color}" opacity="0.92">
          <animate attributeName="height" values="${initialHeight.toFixed(1)};${barHeight.toFixed(1)};${(barHeight * 0.7).toFixed(1)};${initialHeight.toFixed(1)}" keyTimes="0;0.42;0.72;1" calcMode="spline" keySplines="0.33 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" dur="1.8s" begin="${delay}s" repeatCount="indefinite" />
          <animate attributeName="y" values="${(y + height - initialHeight).toFixed(1)};${(y + height - barHeight).toFixed(1)};${(y + height - barHeight * 0.7).toFixed(1)};${(y + height - initialHeight).toFixed(1)}" keyTimes="0;0.42;0.72;1" calcMode="spline" keySplines="0.33 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" dur="1.8s" begin="${delay}s" repeatCount="indefinite" />
        </rect>
      `
    })
    .join('')
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

function renderLargeCard({ theme, size, result, renderId }) {
  const song = latestSong(result)
  const coverSize = 193
  const ringSize = 150

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music recent music">
      ${renderDefs({ theme, id: renderId, size })}
      ${renderBackground({ theme, size, id: renderId })}
      ${renderCover({ song, theme, id: renderId, x: 34, y: 34, size: coverSize })}
      <text x="322" y="47" font-size="13" fill="${theme.subtle}" font-weight="900" letter-spacing="1.2">RECENTLY PLAYED</text>
      ${renderSongInfo({ song, theme, id: renderId, x: 322, y: 95, width: 400, titleSize: 32, metaSize: 16 })}
      <g transform="translate(322 193)">${renderEqualizer({ theme, x: 0, y: 0, width: 140, height: 34, id: renderId })}</g>
      <text x="484" y="227" font-size="16" fill="${theme.muted}" font-weight="800">NetEase Cloud Music</text>
      ${renderWeekRing({ result, theme, id: renderId, x: 752, y: 55, size: ringSize })}
    </svg>
  `
}

function renderMediumCard({ theme, size, result, renderId }) {
  const song = latestSong(result)
  const coverSize = 162

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music recent music">
      ${renderDefs({ theme, id: renderId, size })}
      ${renderBackground({ theme, size, id: renderId })}
      ${renderCover({ song, theme, id: renderId, x: 28, y: 29, size: coverSize })}
      <text x="248" y="41" font-size="12" fill="${theme.subtle}" font-weight="900" letter-spacing="1.2">RECENTLY PLAYED</text>
      ${renderSongInfo({ song, theme, id: renderId, x: 248, y: 87, width: 330, titleSize: 28, metaSize: 15 })}
      <g transform="translate(248 175)">${renderEqualizer({ theme, x: 0, y: 0, width: 122, height: 16, id: renderId })}</g>
      <text x="391" y="191" font-size="15" fill="${theme.muted}" font-weight="800">NetEase Cloud Music</text>
    </svg>
  `
}

function renderSmallCard({ theme, size, result, renderId }) {
  const song = latestSong(result)
  const coverSize = 248
  const centerX = size.width / 2

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NetEase Cloud Music recent music">
      ${renderDefs({ theme, id: renderId, size })}
      ${renderBackground({ theme, size, id: renderId })}
      ${renderCover({ song, theme, id: renderId, x: 36, y: 28, size: coverSize })}
      <text x="${centerX}" y="326" text-anchor="middle" font-size="12" fill="${theme.subtle}" font-weight="900" letter-spacing="1.2">RECENTLY PLAYED</text>
      ${renderSongInfo({ song, theme, id: renderId, x: centerX, y: 360, width: 270, titleSize: 21, metaSize: 13, align: 'center' })}
    </svg>
  `
}

function renderCard({ variant, size, result }) {
  const theme = typeof variant === 'string' ? variants[variant] : variant
  if (!theme) throw new Error(`Unknown classic card variant: ${variant}`)

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
