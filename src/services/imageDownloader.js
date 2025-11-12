import axios from 'axios'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { pipeline } from 'stream/promises'

const folder = './public/images'
const agent = new https.Agent({ keepAlive: true, family: 4 })

export async function downloadImages(urls) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const filename = path.join(folder, `image_${i + 1}.jpg`)

    let success = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

        const res = await axios.get(url, {
          responseType: 'stream',
          httpsAgent: agent,
          signal: controller.signal,
        })

        await pipeline(res.data, fs.createWriteStream(filename))
        clearTimeout(timeout)

        console.log(`✅ Downloaded (${i + 1}/${urls.length}) → ${filename}`)
        success = true
        break
      } catch (err) {
        console.log(`❌ Attempt ${attempt} failed for ${url}: ${err.message}`)
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }

    if (!success) console.log(`⚠️ Could not download ${url}, skipping...`)
  }

  console.log('✅ ---- All downloads finished!')
}
