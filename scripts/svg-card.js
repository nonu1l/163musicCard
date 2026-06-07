const sizes = {
  small: {
    id: 'small',
    width: 320,
    height: 430,
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

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(value, max) {
  const text = String(value || '')
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1))}…`
}

function linearGradient(id, colors, x1 = '0%', y1 = '0%', x2 = '100%', y2 = '0%') {
  const stops = colors
    .map((color, index) => {
      const offset = colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100
      return `<stop offset="${offset}%" stop-color="${color}" />`
    })
    .join('')
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
}

function formatUpdatedAt(date = new Date()) {
  return date.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function renderDefs({ theme, id, size }) {
  return `
    <defs>
      ${linearGradient(`bg-${id}`, [theme.background, theme.band, theme.background])}
      ${linearGradient(`ring-${id}`, [theme.accent2, theme.accent3, theme.accent])}
      ${linearGradient(`shine-${id}`, ['transparent', theme.glow, 'transparent'])}
      <clipPath id="cover-clip-${id}">
        <rect x="0" y="0" width="1" height="1" rx="0.08" />
      </clipPath>
      <filter id="shadow-${id}" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${theme.shadow}" flood-opacity="0.34" />
      </filter>
      <filter id="soft-glow-${id}" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id="card-clip-${id}">
        <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}" rx="${size.radius}" />
      </clipPath>
    </defs>
  `
}

function renderBackground({ theme, size, id }) {
  return `
    <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}" rx="${size.radius}" fill="url(#bg-${id})" stroke="${theme.border}" />
    <g clip-path="url(#card-clip-${id})">
      <path d="M ${Math.round(size.width * 0.62)} -10 L ${Math.round(size.width * 0.78)} ${size.height + 12} L ${size.width + 24} ${size.height + 12} L ${Math.round(size.width * 0.88)} -10 Z" fill="${theme.band2}" opacity="0.32" />
      <rect x="-${size.width}" y="0" width="${Math.round(size.width * 0.42)}" height="${size.height}" fill="url(#shine-${id})" opacity="0.18" transform="skewX(-18)">
        <animate attributeName="x" values="-${size.width};${size.width * 1.15}" dur="8s" repeatCount="indefinite" />
      </rect>
    </g>
  `
}

function renderCover({ song, theme, id, x, y, size }) {
  const href = coverHref(song)
  const clipId = `cover-clip-${id}-${Math.round(x)}-${Math.round(y)}`
  const fallback = `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="${theme.panel}" stroke="${theme.panelBorder}" />
    <circle cx="${x + size * 0.5}" cy="${y + size * 0.46}" r="${size * 0.24}" fill="url(#ring-${id})" opacity="0.9" />
    <circle cx="${x + size * 0.5}" cy="${y + size * 0.46}" r="${size * 0.08}" fill="${theme.background}" />
    <text x="${x + size * 0.5}" y="${y + size * 0.75}" text-anchor="middle" font-size="${Math.max(12, size * 0.08)}" fill="${theme.muted}" font-weight="700">NCM</text>
  `

  if (!href) return fallback

  return `
    <g filter="url(#shadow-${id})">
      <clipPath id="${clipId}">
        <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" />
      </clipPath>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="${theme.panel}" />
      <image href="${escapeXml(href)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="url(#shine-${id})" opacity="0.16">
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="4.8s" repeatCount="indefinite" />
      </rect>
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${Math.round(size * 0.12)}" fill="none" stroke="${theme.panelBorder}" opacity="0.9" />
    </g>
  `
}

function renderSongInfo({ song, theme, x, y, width, titleSize, metaSize, align = 'start' }) {
  const anchor = align === 'center' ? 'middle' : 'start'
  const titleMax = width < 260 ? 17 : width < 390 ? 24 : 36
  const metaMax = width < 260 ? 24 : width < 390 ? 34 : 52

  return `
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${titleSize}" fill="${theme.text}" font-weight="900">${escapeXml(truncate(song.name || 'Unknown', titleMax))}</text>
    <text x="${x}" y="${y + titleSize + 22}" text-anchor="${anchor}" font-size="${metaSize}" fill="${theme.accent}" font-weight="800">${escapeXml(truncate(song.artists || 'Unknown artist', metaMax))}</text>
    <text x="${x}" y="${y + titleSize + 48}" text-anchor="${anchor}" font-size="${metaSize}" fill="${theme.muted}">${escapeXml(truncate(song.album || 'Unknown album', metaMax))}</text>
  `
}

function renderEqualizer({ theme, x, y, width, height, id }) {
  const bars = [0.35, 0.68, 0.48, 0.85, 0.42, 0.62, 0.32, 0.76]
  const gap = width / bars.length

  return bars
    .map((value, index) => {
      const barHeight = Math.max(8, value * height)
      const bx = x + index * gap
      const delay = (index * 0.17).toFixed(2)
      const color = theme.waveform[index % theme.waveform.length]
      return `
        <rect x="${bx.toFixed(1)}" y="${(y + height - barHeight).toFixed(1)}" width="${Math.max(4, gap * 0.42).toFixed(1)}" height="${barHeight.toFixed(1)}" rx="3" fill="${color}" opacity="0.92">
          <animate attributeName="height" values="${(barHeight * 0.5).toFixed(1)};${barHeight.toFixed(1)};${(barHeight * 0.65).toFixed(1)}" dur="1.8s" begin="${delay}s" repeatCount="indefinite" />
          <animate attributeName="y" values="${(y + height - barHeight * 0.5).toFixed(1)};${(y + height - barHeight).toFixed(1)};${(y + height - barHeight * 0.65).toFixed(1)}" dur="1.8s" begin="${delay}s" repeatCount="indefinite" />
        </rect>
      `
    })
    .join('')
}

function renderWeekRing({ result, theme, id, x, y, size }) {
  const week = result.week || {}
  const percent = Math.max(0, Math.min(1, Number(week.percent || 0)))
  const center = size / 2
  const radius = size / 2 - 12
  const circumference = 2 * Math.PI * radius
  const dash = circumference * percent
  const rest = circumference - dash
  const label = week.label || '0m'
  const percentLabel = `${Math.round(percent * 100)}%`

  return `
    <g transform="translate(${x} ${y})">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${theme.panel}" stroke="${theme.divider}" stroke-width="13" opacity="0.9" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="url(#ring-${id})" stroke-width="13" stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${rest.toFixed(2)}" transform="rotate(-90 ${center} ${center})">
        <animateTransform attributeName="transform" type="rotate" from="-90 ${center} ${center}" to="270 ${center} ${center}" dur="18s" repeatCount="indefinite" />
      </circle>
      <text x="${center}" y="${center - 4}" text-anchor="middle" font-size="${Math.max(18, size * 0.16)}" fill="${theme.text}" font-weight="900">${escapeXml(label)}</text>
      <text x="${center}" y="${center + 22}" text-anchor="middle" font-size="${Math.max(10, size * 0.08)}" fill="${theme.muted}">this week · ${percentLabel}</text>
    </g>
  `
}

function renderLargeCard({ theme, size, result, id }) {
  const song = latestSong(result)
  const coverSize = 196
  const ringSize = 150

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Netease recent music">
      ${renderDefs({ theme, id, size })}
      ${renderBackground({ theme, size, id })}
      ${renderCover({ song, theme, id, x: 34, y: 30, size: coverSize })}
      <text x="282" y="56" font-size="13" fill="${theme.subtle}" font-weight="900">LATEST PLAY</text>
      ${renderSongInfo({ song, theme, x: 282, y: 104, width: 390, titleSize: 32, metaSize: 16 })}
      <g transform="translate(282 202)">${renderEqualizer({ theme, x: 0, y: 0, width: 140, height: 34, id })}</g>
      <text x="444" y="224" font-size="12" fill="${theme.muted}">updated ${escapeXml(formatUpdatedAt())}</text>
      ${renderWeekRing({ result, theme, id, x: 752, y: 34, size: ringSize })}
      <text x="827" y="214" text-anchor="middle" font-size="13" fill="${theme.muted}">weekly listening time</text>
    </svg>
  `
}

function renderMediumCard({ theme, size, result, id }) {
  const song = latestSong(result)
  const coverSize = 158

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Netease recent music">
      ${renderDefs({ theme, id, size })}
      ${renderBackground({ theme, size, id })}
      ${renderCover({ song, theme, id, x: 28, y: 31, size: coverSize })}
      <text x="222" y="54" font-size="12" fill="${theme.subtle}" font-weight="900">RECENTLY PLAYED</text>
      ${renderSongInfo({ song, theme, x: 222, y: 100, width: 360, titleSize: 28, metaSize: 15 })}
      <g transform="translate(222 172)">${renderEqualizer({ theme, x: 0, y: 0, width: 122, height: 26, id })}</g>
      <text x="365" y="190" font-size="12" fill="${theme.muted}">${escapeXml(formatUpdatedAt())}</text>
    </svg>
  `
}

function renderSmallCard({ theme, size, result, id }) {
  const song = latestSong(result)
  const coverSize = 260
  const centerX = size.width / 2

  return `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Netease recent music">
      ${renderDefs({ theme, id, size })}
      ${renderBackground({ theme, size, id })}
      ${renderCover({ song, theme, id, x: 30, y: 28, size: coverSize })}
      <text x="${centerX}" y="330" text-anchor="middle" font-size="12" fill="${theme.subtle}" font-weight="900">LATEST PLAY</text>
      ${renderSongInfo({ song, theme, x: centerX, y: 362, width: 270, titleSize: 22, metaSize: 13, align: 'center' })}
    </svg>
  `
}

function renderCard({ theme, size, result }) {
  const id = `${theme.id}-${size.id}`.replace(/[^a-z0-9-]/gi, '-')
  const renderers = {
    dashboard: renderLargeCard,
    horizontal: renderMediumCard,
    vertical: renderSmallCard,
  }
  const svg = renderers[size.mode]({ theme, size, result, id })

  return svg
    .replace(/>\s+</g, '><')
    .trim()
}

module.exports = {
  renderCard,
  sizes,
}
