import 'dotenv/config'
import axios from 'axios'

const perPage = 30 // max per Unsplash request
const parallelBatches = 5 // how many batches to fetch simultaneously

// ------------------------
// Unsplash keys
// ------------------------
const UNSPLASH_KEYS = [
  process.env.UNSPLASH_KEY_1,
  process.env.UNSPLASH_KEY_2,
  process.env.UNSPLASH_KEY_3,
  process.env.UNSPLASH_KEY_4,
  process.env.UNSPLASH_KEY_5,
].filter(Boolean)

if (!UNSPLASH_KEYS.length) throw new Error('No Unsplash keys found in .env')

// ------------------------
// Key rotation generator
// ------------------------
function* keyGenerator() {
  let i = 0
  while (true) {
    yield UNSPLASH_KEYS[i]
    i = (i + 1) % UNSPLASH_KEYS.length
  }
}
const keyGen = keyGenerator()
function getNextKey() {
  return keyGen.next().value
}

// ------------------------
// Utilities
// ------------------------
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

// ------------------------
// Fetch a single batch
// ------------------------
async function fetchUnsplashBatch(query, count, cache) {
  const results = []
  let attempts = 0

  while (results.length < count && attempts < 10) {
    attempts++
    const currentKey = getNextKey()
    const randomPage = Math.floor(Math.random() * 800) + 1
    const orderBy = Math.random() > 0.5 ? 'latest' : 'relevant'

    const url =
      `https://api.unsplash.com/search/photos` +
      `?query=${encodeURIComponent(query)}` +
      `&per_page=${count}` +
      `&page=${randomPage}` +
      `&orientation=landscape` +
      `&order_by=${orderBy}`

    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Client-ID ${currentKey}` },
      })

      for (const img of res.data.results) {
        const raw = img.urls.raw
        if (cache.has(raw)) continue

        results.push(`${raw}&w=1920&h=1080&fit=crop`)
        cache.add(raw)

        if (results.length >= count) break
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 403 || status === 429) {
        console.log(`⚠️ Key rate-limited → switching key...`)
        await wait(500)
        continue
      }
      console.log('❌ Unsplash error:', err.message)
    }
  }

  return results
}

// ------------------------
// Main function: fetch all images with parallel batches
// ------------------------
export async function fetchImageUrls(query, totalImages) {
  const cache = new Set()
  const result = []

  console.log(`🔍 Fetching ${totalImages} images for "${query}"...`)

  while (result.length < totalImages) {
    const remaining = totalImages - result.length
    const batchesToFetch = Math.min(
      parallelBatches,
      Math.ceil(remaining / perPage)
    )

    const promises = []
    for (let i = 0; i < batchesToFetch; i++) {
      const batchSize = Math.min(perPage, remaining - i * perPage)
      promises.push(fetchUnsplashBatch(query, batchSize, cache))
    }

    const batches = await Promise.all(promises)
    batches.forEach((batch) => result.push(...batch))

    console.log(`✅ Total fetched so far: ${result.length}/${totalImages}`)
  }

  shuffle(result)
  console.log(`🎉 Finished! Total images: ${result.length}`)

  return result
}
