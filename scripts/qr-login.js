const fs = require('fs')
const path = require('path')
const QRCode = require('qrcode')
const {
  login_qr_key,
  login_qr_check,
  login_status,
} = require('NeteaseCloudMusicApi')
const { writeLocalEnv, envPath } = require('./env')

const outputDir = path.resolve(__dirname, '..', '.cache')
const qrPath = path.join(outputDir, 'netease-login-qr.png')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseCookieValue(cookie, key) {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]+)`))
  return match ? match[1] : ''
}

function normalizeCookie(cookie) {
  const parts = Array.isArray(cookie) ? cookie : cookie.split(';;')

  return parts
    .map((part) => part.replaceAll(' HTTPOnly', '').trim())
    .filter(Boolean)
    .map((part) => part.split(';')[0])
    .join('; ')
}

function normalizeFallbackCookie(cookie) {
  return cookie
    .replaceAll(' HTTPOnly', '')
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })

  const keyResult = await login_qr_key({ timestamp: Date.now() })
  const key = keyResult.body?.data?.unikey
  if (!key) {
    throw new Error(`Failed to create QR key: ${JSON.stringify(keyResult.body)}`)
  }

  const loginUrl = `https://music.163.com/login?codekey=${key}`
  await QRCode.toFile(qrPath, loginUrl, { width: 280, margin: 1 })

  console.log(`Open or scan this QR code: ${qrPath}`)
  console.log(loginUrl)
  console.log('Waiting for confirmation in NetEase Cloud Music app...')

  const deadline = Date.now() + 3 * 60 * 1000
  while (Date.now() < deadline) {
    const checkResult = await login_qr_check({
      key,
      timestamp: Date.now(),
    })
    const body = checkResult.body || {}

    if (body.code === 800) {
      throw new Error('QR code expired. Run npm run login again.')
    }

    if (body.code === 802) {
      console.log('Scanned. Please confirm login in the app.')
    }

    if (body.code === 803) {
      const cookie = Array.isArray(checkResult.cookie)
        ? normalizeCookie(checkResult.cookie)
        : normalizeFallbackCookie(body.cookie || '')
      const musicU = parseCookieValue(cookie, 'MUSIC_U')
      const csrf = parseCookieValue(cookie, '__csrf')

      if (!musicU) {
        throw new Error(`Login succeeded but MUSIC_U was not found: ${body.cookie}`)
      }

      writeLocalEnv({
        MUSIC_U: musicU,
        NETEASE_COOKIE: cookie,
      })

      const status = await login_status({ cookie })
      const profile = status.body?.data?.profile || status.body?.profile

      console.log(`Saved login cookie to ${envPath}`)
      if (csrf) console.log('Saved __csrf inside NETEASE_COOKIE.')
      if (profile) {
        console.log(`Logged in as: ${profile.nickname} (${profile.userId})`)
      }
      return
    }

    await sleep(1000)
  }

  throw new Error('Timed out waiting for QR login.')
}

main().catch((error) => {
  console.error(error.stack || error.message || error)
  process.exit(1)
})
