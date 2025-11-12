import fs from 'fs'
import path from 'path'
import axios from 'axios'
import https from 'https'

const folder = './public/images'
const agent = new https.Agent({ keepAlive: true, family: 4 })

export async function downloadImages(urls, concurrency = 2) {
  let index = 0

  const worker = async () => {
    while (index < urls.length) {
      const i = index++
      const url = urls[i]
      const filePath = path.join(folder, `image_${i + 1}.jpg`)

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 30000,
            httpsAgent: agent,
          })

          // Pipe stream directly to file
          const writer = fs.createWriteStream(filePath)
          response.data.pipe(writer)

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
          })

          console.log(`✅ Downloaded (${i + 1}/${urls.length}) → ${filePath}`)
          break
        } catch (err) {
          console.log(`❌ Attempt ${attempt} failed for ${url}: ${err.message}`)
          if (attempt === 3) console.log(`⚠️ Could not download ${url}`)
          else await new Promise((r) => setTimeout(r, 1000 * attempt))
        }
      }
    }
  }

  // Launch N workers for concurrency
  await Promise.all(Array(concurrency).fill(0).map(worker))
  console.log('✅ ---- All downloads finished!')
}
