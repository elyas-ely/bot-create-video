import 'dotenv/config'
import axios from 'axios'

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
const perPage = 30

export async function fetchImageUrls(query, totalImages) {
  const urls = []
  const cache = new Set() // 🔥 caching system to avoid duplicates

  let attempts = 0

  while (urls.length < totalImages && attempts < 25) {
    attempts++

    const remaining = totalImages - urls.length
    const fetchCount = Math.min(remaining, perPage)

    // random page (big range for variety)
    const randomPage = Math.floor(Math.random() * 1000) + 1

    // random sort
    const orderBy = Math.random() > 0.5 ? 'latest' : 'relevant'

    const apiUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=${fetchCount}&page=${randomPage}&orientation=landscape&order_by=${orderBy}`

    try {
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      })

      if (!res.data.results.length) {
        // console.log(`⚠️ Page ${randomPage} returned 0 images, retrying...`)
        continue
      }

      for (const img of res.data.results) {
        const rawBase = img.urls.raw

        // Skip if already in cache
        if (cache.has(rawBase)) {
          continue
        }

        // Add to cache
        cache.add(rawBase)

        // Force Full HD 1080p
        const url1080p = `${rawBase}&w=1920&h=1080&fit=crop`
        urls.push(url1080p)

        if (urls.length >= totalImages) break
      }
    } catch (err) {
      if (err.response?.status === 429) {
        console.log('⏳ Rate limited by Unsplash. Waiting 1s...')
        await new Promise((res) => setTimeout(res, 1000))
        continue
      }

      console.log('❌ Error fetching images:', err.message)
      break
    }
  }

  console.log(`🔗 FULL HD images urls (unique): ${urls.length}`)
  return urls
}
