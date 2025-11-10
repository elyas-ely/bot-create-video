import axios from 'axios'
import fs from 'fs'
import path from 'path'
import https from 'https'

const folder = './public/images'

if (!fs.existsSync(folder)) fs.mkdirSync(folder)

// https agent to force IPv4 + keep-alive
const agent = new https.Agent({ keepAlive: true, family: 4 })

export async function downloadImages(urls) {
  let count = 1

  for (const url of urls) {
    const filename = path.join(folder, `image_${count}.jpg`)

    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        httpsAgent: agent,
      })

      fs.writeFileSync(filename, res.data)
      console.log(`✅ Downloaded (${count}/${urls.length}) → ${filename}`)
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

    count++
  }

  console.log('✅ ---- All downloads finished!')
}
