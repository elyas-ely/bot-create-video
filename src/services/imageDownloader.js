import axios from 'axios'
import fs from 'fs'
import path from 'path'
import https from 'https'

const folder = './public/images'

// https agent to force IPv4 + keep-alive
const agent = new https.Agent({ keepAlive: true, family: 4 })

export async function downloadImages(urls, concurrent = 10) {
  return console.log('2 - all images fetched')

  let count = 1

  // Helper to download a single image
  const downloadSingle = async (url, index) => {
    const filename = path.join(folder, `image_${index + 1}.jpg`)

    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        httpsAgent: agent,
      })

      fs.writeFileSync(filename, res.data)
      console.log(`✅ Downloaded (${index + 1}/${urls.length}) → ${filename}`)
    } catch (err) {
      console.log(`❌ Failed to download ${url}, retrying...`)
      try {
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          httpsAgent: agent,
        })
        fs.writeFileSync(filename, res.data)
        console.log(`✅ Retry successful → ${filename}`)
      } catch {
        console.log(`⚠️ Could not download ${url}`)
      }
    }
  }

  // Split into batches of `concurrent`
  for (let i = 0; i < urls.length; i += concurrent) {
    const batch = urls.slice(i, i + concurrent)
    await Promise.all(batch.map((url, idx) => downloadSingle(url, i + idx)))
  }

  console.log('✅ ---- All downloads finished!')
}
