const classic = require('./classic')
const weeklyRank = require('./classic-weekly-rank')

const id = 'classic-dynamic'
const label = 'Classic Dynamic'
const order = 30
const sizes = classic.sizes
const variants = classic.variants

function renderCard({ variant, size, result }) {
  const isRecentlyPlaying = Boolean(result.listeningState?.isRecentlyPlaying)
  const renderer = isRecentlyPlaying ? classic : weeklyRank
  const svg = renderer.renderCard({ variant, size, result })

  return svg
    .replace(/classic-/g, `${id}-`)
    .replace(/classic-weekly-rank/g, `${id}-`)
}

module.exports = {
  id,
  label,
  order,
  renderCard,
  sizes,
  variants,
}
