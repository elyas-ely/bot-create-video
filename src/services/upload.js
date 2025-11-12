// videoBot.js
import fs from 'fs'
import { google } from 'googleapis'
import readline from 'readline'
import 'dotenv/config'

const isProduction = process.env.NODE_ENV === 'production'
console.log('isProduction:', isProduction)

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
const TOKEN_PATH = isProduction ? '/app/token.json' : 'token.json'
const VIDEO_FILE = 'public/final/final_video.mp4'

const credentialsPath = isProduction
  ? '/app/credentials.json'
  : 'credentials.json'

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath))
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH))
    oAuth2Client.setCredentials(token)
    oAuth2Client.on('tokens', (newTokens) => {
      if (newTokens.refresh_token) token.refresh_token = newTokens.refresh_token
      token.access_token = newTokens.access_token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
    })
    return oAuth2Client
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
  console.log('Authorize this app by visiting this URL:\n', authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const code = await new Promise((resolve) =>
    rl.question('Enter the code: ', (input) => {
      rl.close()
      resolve(input.trim())
    })
  )
  const { tokens } = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
  return oAuth2Client
}

export async function uploadVideo() {
  // return console.log('4 - video uploaded')

  const auth = await authorize()
  const youtube = google.youtube({ version: 'v3', auth })

  try {
    console.log('uploading the video')

    const res = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: `My Relaxing Video ${isProduction ? 'VPS' : 'Local'}`,
          description: 'This video was uploaded automatically using Node.js 🤖',
          tags: ['relaxing', 'ai', 'nature'],
        },
        status: { privacyStatus: 'unlisted' },
      },
      media: { body: fs.createReadStream(VIDEO_FILE) },
    })

    console.log('✅ Video uploaded successfully!')
    console.log(
      'YouTube URL:',
      `https://www.youtube.com/watch?v=${res.data.id}`
    )
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
