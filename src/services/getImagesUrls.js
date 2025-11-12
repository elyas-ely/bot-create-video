import 'dotenv/config'
import axios from 'axios'

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
if (!ACCESS_KEY) {
  throw new Error('Missing UNSPLASH_ACCESS_KEY in environment variables (.env)')
}
const perPage = 30

export async function fetchImageUrls(query, totalImages) {
  // return console.log('urls fetched')

  let urls = []
  let page = 1

  while (urls.length < totalImages) {
    const remaining = totalImages - urls.length
    const fetchCount = remaining < perPage ? remaining : perPage

    const apiUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=${fetchCount}&page=${page}`

    const res = await axios.get(apiUrl, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    })

    for (const img of res.data.results) {
      // ✅ keep only horizontal images
      if (img.width > img.height) {
        // ✅ force landscape 720p resolution
        const url720p = `${img.urls.raw}&w=1280&h=720&fit=crop`
        urls.push(url720p)

        if (urls.length >= totalImages) break
      }
    }

    page++
  }
  console.log('✅ ---- Image URLs fetched:', urls.length)
  return urls
}
