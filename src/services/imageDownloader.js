import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import https from 'https'

const folder = './public/images'
const agent = new https.Agent({ keepAlive: true, family: 4 })

export async function downloadImages(urls, concurrency = 1) {
  let index = 0

  const worker = async () => {
    while (index < urls.length) {
      const i = index++
      const url = urls[i]
      const filename = path.join(folder, `image_${i + 1}.jpg`)

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            httpsAgent: agent,
          })
          await fs.writeFile(filename, res.data)
          // console.log(`✅ Downloaded (${i + 1}/${urls.length}) → ${filename}`)
          break
        } catch (err) {
          console.log(`❌ Attempt ${attempt} failed for ${url}: ${err.message}`)
          if (attempt === 3) console.log(`⚠️ Could not download ${url}`)
          else await new Promise((r) => setTimeout(r, 1000 * attempt))
        }
      }
    }
  }

  await Promise.all(Array(concurrency).fill(0).map(worker))
  console.log('✅ ---- All downloads finished!')
}
