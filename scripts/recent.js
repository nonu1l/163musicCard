const { getRecentSongs } = require('./music')

async function main() {
  const result = await getRecentSongs({ limit: 20 })
  if (result.profile) {
    console.log(`Account: ${result.profile.nickname} (${result.profile.userId})`)
  }
  if (!result.songs.length) console.log('No recent songs were returned.')
  console.table(result.songs)
}

main().catch((error) => {
  console.error(error.stack || error.message || error)
  process.exit(1)
})
