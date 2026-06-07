const {
  listen_data_realtime_report,
  login_status,
  record_recent_song,
  recent_listen_list,
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

function pickSong(item) {
  const song = item.data || item.song || item.resource || item
  const artists = song.ar || song.artists || []
  const album = song.al || song.album || {}
  const coverUrl = album.picUrl || song.picUrl || song.coverUrl || song.songPicUrl || ''
  const playTime =
    item.playTime || item.time || item.resourcePlayTime || item.playedTime

  return {
    name: song.name || '',
    artists: artists.map((artist) => artist.name).filter(Boolean).join(', '),
    album: album.name || '',
    coverUrl,
    id: song.id || '',
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

module.exports = {
  getRecentSongs,
}
