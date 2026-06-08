const {
  listen_data_realtime_report,
  login_status,
  record_recent_song,
  recent_listen_list,
  user_record,
} = require('NeteaseCloudMusicApi')
const { loadLocalEnv } = require('./env')

function loadCookie() {
  loadLocalEnv()

  if (process.env.NETEASE_COOKIE) return process.env.NETEASE_COOKIE
  if (process.env.MUSIC_U) return `MUSIC_U=${process.env.MUSIC_U};`
  return ''
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', { hour12: false })
}

function parsePlayTime(value) {
  const time = Number(value || 0)
  return Number.isFinite(time) && time > 0 ? time : 0
}

function normalizeTitlePart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[（）]/g, (char) => (char === '（' ? '(' : ')'))
    .replace(/\s+/g, ' ')
    .trim()
}

function firstNonEmptyText(...values) {
  for (const value of values) {
    const items = Array.isArray(value) ? value : [value]
    const found = items.find((item) => String(item || '').trim())
    if (found) return String(found).trim()
  }

  return ''
}

function pickAlias(song) {
  const alias = firstNonEmptyText(
    song.alia,
    song.alias,
    song.transNames,
    song.tns,
    song.additionalTitle
  )
  if (!alias) return ''

  const normalizedName = normalizeTitlePart(song.name)
  const normalizedAlias = normalizeTitlePart(alias)
  const normalizedWrappedAlias = normalizeTitlePart(`(${alias})`)

  if (
    normalizedName.includes(normalizedAlias) ||
    normalizedName.includes(normalizedWrappedAlias)
  ) {
    return ''
  }

  return alias
}

function pickSong(item) {
  const song = item.data || item.song || item.resource || item
  const artists = song.ar || song.artists || []
  const album = song.al || song.album || {}
  const coverUrl = album.picUrl || song.picUrl || song.coverUrl || song.songPicUrl || ''
  const playTime =
    item.playTime || item.time || item.resourcePlayTime || item.playedTime
  const playTimeMs = parsePlayTime(playTime)

  return {
    name: song.name || '',
    alias: pickAlias(song),
    artists: artists.map((artist) => artist.name).filter(Boolean).join(' / '),
    album: album.name || '',
    coverUrl,
    id: song.id || '',
    durationMs: Number(song.dt || song.duration || 0),
    playTimeMs,
    playTime: formatTime(playTime),
  }
}

function formatWeekDuration(minutes) {
  const value = Number(minutes || 0)
  const hours = Math.floor(value / 60)
  const restMinutes = Math.round(value % 60)

  if (hours <= 0) return `${restMinutes}m`
  if (restMinutes <= 0) return `${hours}h`
  return `${hours}h ${restMinutes}m`
}

async function getWeekStats(cookie) {
  try {
    const response = await listen_data_realtime_report({ type: 'week', cookie })
    const block = response.body?.data?.listenTimeDistributionBlock || {}
    const playMinutes = Number(block.playDuration || 0)
    const weekMinutes = 7 * 24 * 60

    return {
      playMinutes,
      label: formatWeekDuration(playMinutes),
      percent: Math.max(0, Math.min(1, playMinutes / weekMinutes)),
      listenDays: Number(block.listenDays || 0),
      details: block.durationDetails || [],
    }
  } catch {
    return {
      playMinutes: 0,
      label: '0m',
      percent: 0,
      listenDays: 0,
      details: [],
    }
  }
}

async function getLoginProfile(cookie) {
  const status = await login_status({ cookie })
  return status.body?.data?.profile || status.body?.profile || null
}

async function getRecentSongs({ limit = 10 } = {}) {
  const cookie = loadCookie()
  if (!cookie) {
    throw new Error('No login cookie found. Run `npm run login` first, or set NETEASE_COOKIE/MUSIC_U.')
  }

  const profile = await getLoginProfile(cookie)
  const week = await getWeekStats(cookie)

  const recentSongs = await record_recent_song({ limit, cookie })
  const list = recentSongs.body?.data?.list || []
  if (list.length > 0) {
    return {
      profile,
      week,
      songs: list.slice(0, limit).map(pickSong),
      source: 'record_recent_song',
    }
  }

  const recentList = await recent_listen_list({ cookie })
  const resources = recentList.body?.data?.resources || []
  if (resources.length > 0) {
    return {
      profile,
      week,
      songs: resources.slice(0, limit).map(pickSong),
      source: 'recent_listen_list',
    }
  }

  return {
    profile,
    week,
    songs: [],
    source: 'none',
    raw: {
      record_recent_song: recentSongs.body,
      recent_listen_list: recentList.body,
    },
  }
}

function pickRankSong(item, index, maxPlayCount) {
  const song = item.song || item.data || item.resource || item
  const picked = pickSong({ data: song })
  const playCount = Number(item.playCount || item.count || 0)

  return {
    rank: index + 1,
    playCount,
    progress: maxPlayCount > 0 ? Math.round((playCount / maxPlayCount) * 100) : 0,
    score: Number(item.score || 0),
    song: picked,
  }
}

async function getWeeklyRank({ limit = 20 } = {}) {
  const cookie = loadCookie()
  if (!cookie) {
    throw new Error('No login cookie found. Run `npm run login` first, or set NETEASE_COOKIE/MUSIC_U.')
  }

  const profile = await getLoginProfile(cookie)
  const week = await getWeekStats(cookie)
  const uid = profile?.userId
  if (!uid) {
    return {
      profile,
      week,
      songs: [],
      source: 'user_record',
    }
  }

  const response = await user_record({ uid, type: 1, cookie })
  const list = response.body?.weekData || []
  const sliced = list.slice(0, limit)
  const maxPlayCount = Math.max(...sliced.map((item) => Number(item.playCount || 0)), 0)

  return {
    profile,
    week,
    songs: sliced.map((item, index) => pickRankSong(item, index, maxPlayCount)),
    source: 'user_record',
  }
}

function buildListeningState(result, previousState = null, now = Date.now()) {
  const latest = result.songs?.[0] || null
  const latestSongId = latest?.id || ''
  const weekPlayMinutes = Number(result.week?.playMinutes || 0)
  const stateSignature = `${latestSongId}:${weekPlayMinutes}`
  const previousSignature = previousState?.stateSignature || ''
  const stableBuildCount = latestSongId && stateSignature === previousSignature
    ? Number(previousState?.stableBuildCount || 0) + 1
    : latestSongId
      ? 1
      : 0

  return {
    generatedAt: new Date(now).toISOString(),
    latestSongId,
    weekPlayMinutes,
    stateSignature,
    previousSignature,
    stableBuildCount,
    isRecentlyPlaying: Boolean(latestSongId) && stableBuildCount < 3,
  }
}

module.exports = {
  buildListeningState,
  getRecentSongs,
  getWeeklyRank,
}
