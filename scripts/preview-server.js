const fs = require('fs')
const http = require('http')
const path = require('path')

const root = path.resolve(__dirname, '..')
const cardsDir = path.join(root, 'cards')
const cardDesignsDir = path.join(__dirname, 'cards')
const port = Number(process.env.PORT || 4178)

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
}

// 临时:不显示以该前缀开头的卡片目录(注释掉或清空数组即可恢复显示)
const EXCLUDED_DIR_PREFIXES = []

function loadCardOrders() {
  if (!fs.existsSync(cardDesignsDir)) return new Map()

  const orders = new Map()
  for (const file of fs.readdirSync(cardDesignsDir)) {
    if (!file.endsWith('.js')) continue

    const cardPath = path.join(cardDesignsDir, file)
    delete require.cache[require.resolve(cardPath)]
    const card = require(cardPath)
    if (card && card.id) {
      orders.set(card.id, Number.isFinite(card.order) ? card.order : Number.MAX_SAFE_INTEGER)
    }
  }
  return orders
}

function listCards() {
  if (!fs.existsSync(cardsDir)) return []

  const files = []
  const walk = (dir) => {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        if (EXCLUDED_DIR_PREFIXES.some((prefix) => file.startsWith(prefix))) continue
        walk(filePath)
        continue
      }

      if (file.endsWith('.svg')) {
        files.push(path.relative(cardsDir, filePath).replace(/\\/g, '/'))
      }
    }
  }

  walk(cardsDir)

  const cardOrders = loadCardOrders()
  const themeOrder = ['dark', 'light']
  const sizeOrder = ['large', 'medium', 'small']

  return files
    .sort((a, b) => {
      const parse = (file) => {
        const [cardId, filename = ''] = file.split('/')
        const basename = filename.replace(/\.svg$/, '')
        const size = sizeOrder.find((item) => basename.endsWith(`-${item}`)) || ''
        const variant = size ? basename.slice(0, -size.length - 1) : basename

        return {
          cardId,
          card: cardOrders.has(cardId) ? cardOrders.get(cardId) : Number.MAX_SAFE_INTEGER,
          theme: themeOrder.includes(variant) ? themeOrder.indexOf(variant) : themeOrder.length,
          size: sizeOrder.includes(size) ? sizeOrder.indexOf(size) : sizeOrder.length,
        }
      }
      const left = parse(a)
      const right = parse(b)

      return left.card - right.card
        || left.theme - right.theme
        || left.size - right.size
        || a.localeCompare(b)
    })
}

function renderPage() {
  const cards = listCards()
  const cardMarkup = cards
    .map((file) => {
      const label = file
        .replace(/\//g, ' / ')
        .replace('.svg', '')
        // .replace('-', ' / ')

      return `
        <section class="preview-card">
          <div class="label">${label}</div>
          <div class="frame">
            <img src="/cards/${file}" alt="${label}" />
          </div>
        </section>
      `
    })
    .join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NetEase Cloud Music Card Preview</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #101014;
      color: #f7f2fb;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 12% 0%, rgba(255, 102, 190, 0.18), transparent 36rem),
        radial-gradient(circle at 86% 4%, rgba(54, 212, 255, 0.16), transparent 34rem),
        #101014;
    }

    main {
      width: min(1120px, calc(100vw - 40px));
      margin: 0 auto;
      padding: 32px 0 56px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 24px;
      letter-spacing: 0;
    }

    .meta {
      margin: 0 0 28px;
      color: #beb5c8;
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 26px;
    }

    .preview-card {
      display: grid;
      gap: 10px;
    }

    .label {
      color: #d9c8ff;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .frame {
      overflow: auto;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.06);
    }

    img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    @media (prefers-color-scheme: light) {
      :root {
        background: #fff7fb;
        color: #241226;
      }

      body {
        background:
          radial-gradient(circle at 12% 0%, rgba(255, 143, 173, 0.28), transparent 34rem),
          radial-gradient(circle at 86% 4%, rgba(255, 209, 79, 0.18), transparent 34rem),
          #fff7fb;
      }

      .meta {
        color: #8c6480;
      }

      .label {
        color: #c23a83;
      }

      .frame {
        border-color: rgba(215, 75, 139, 0.18);
        background: rgba(255, 255, 255, 0.62);
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>NetEase Cloud Music Card Preview</h1>
    <p class="meta">Serving ${cards.length} generated SVG cards from <code>cards/</code>.</p>
    <div class="grid">
      ${cardMarkup || '<p>No SVG cards found. Run <code>npm run generate-cards</code>.</p>'}
    </div>
  </main>
</body>
</html>`
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath)
  const type = mimeTypes[ext] || 'application/octet-stream'
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-store',
    })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    res.end(renderPage())
    return
  }

  if (url.pathname === '/favicon.ico') {
    res.writeHead(204, { 'Cache-Control': 'no-store' })
    res.end()
    return
  }

  const requestedPath = path.normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '')
  const filePath = path.join(root, requestedPath)

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  sendFile(res, filePath)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview server running at http://127.0.0.1:${port}`)
})
