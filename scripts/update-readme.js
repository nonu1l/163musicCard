const fs = require('fs')
const path = require('path')
const { getRecentSongs } = require('./music')

const startMarker = '<!-- NETEASE_MUSIC:START -->'
const endMarker = '<!-- NETEASE_MUSIC:END -->'
const readmePath = path.resolve(__dirname, '..', 'README.md')

function escapeMarkdown(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function songUrl(song) {
  return song.id ? `https://music.163.com/#/song?id=${song.id}` : ''
}

function renderSong(song, index) {
  const title = escapeMarkdown(song.name || 'Unknown')
  const artists = escapeMarkdown(song.artists || 'Unknown artist')
  const time = song.playTime ? ` · ${escapeMarkdown(song.playTime)}` : ''
  const url = songUrl(song)
  const linkedTitle = url ? `[${title}](${url})` : title

  return `${index + 1}. ${linkedTitle} - ${artists}${time}`
}

function renderBlock(result) {
  if (!result.songs.length) {
    return '最近播放列表暂时为空。'
  }

  return result.songs.map(renderSong).join('\n')
}

function ensureReadme(content) {
  if (content.includes(startMarker) && content.includes(endMarker)) {
    return content
  }

  const intro = content.trimEnd()
  const section = [
    '',
    '## 最近在听',
    '',
    startMarker,
    '加载中...',
    endMarker,
    '',
  ].join('\n')

  return intro ? `${intro}\n${section}` : section.trimStart()
}

function replaceBlock(content, block) {
  const pattern = new RegExp(
    `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  )

  return content.replace(pattern, `${startMarker}\n${block}\n${endMarker}`)
}

async function main() {
  const limit = Number(process.env.MUSIC_LIMIT || 5)
  const result = await getRecentSongs({ limit })
  const block = renderBlock(result)

  const current = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, 'utf8')
    : ''
  const next = replaceBlock(ensureReadme(current), block)

  if (current === next) {
    console.log('README.md is already up to date.')
    return
  }

  fs.writeFileSync(readmePath, next, 'utf8')
  console.log(`Updated README.md with ${result.songs.length} recent songs.`)
  if (result.profile) {
    console.log(`Account: ${result.profile.nickname} (${result.profile.userId})`)
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error)
  process.exit(1)
})

