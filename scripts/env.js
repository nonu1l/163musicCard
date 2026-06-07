const fs = require('fs')
const path = require('path')

const envPath = path.resolve(__dirname, '..', '.env.local')

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return {}

  const values = {}
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue
    const index = line.indexOf('=')
    if (index === -1) continue

    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    values[key] = value
    if (!process.env[key]) process.env[key] = value
  }

  return values
}

function writeLocalEnv(values) {
  const existing = loadLocalEnv()
  const next = { ...existing, ...values }
  const content =
    Object.entries(next)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, '')}`)
      .join('\n') + '\n'

  fs.writeFileSync(envPath, content, 'utf8')
}

module.exports = {
  envPath,
  loadLocalEnv,
  writeLocalEnv,
}

