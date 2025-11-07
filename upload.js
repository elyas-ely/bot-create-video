import fs from 'fs'
import { google } from 'googleapis'
import readline from 'readline'

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
const TOKEN_PATH = 'token.json'

// Load OAuth2 client
async function authorize() {
  const credentials = JSON.parse(fs.readFileSync('credentials.json'))
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  // Try to load existing token
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)))
    return oAuth2Client
  }

  // Generate auth URL for manual login
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this URL:\n', authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const code = await new Promise((resolve) => {
    rl.question('Enter the code from that page here: ', (input) => {
      rl.close()
      resolve(input.trim())
    })
  })

  const { tokens } = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
  console.log('Token stored to', TOKEN_PATH)
  return oAuth2Client
}

// Upload video
export async function uploadVideo(auth) {
  const youtube = google.youtube({ version: 'v3', auth })

  try {
    console.log('uploading video')

    const res = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: 'My Relaxing Video',
          description: 'This video was uploaded automatically using Node.js 🤖',
          tags: ['relaxing', 'ai', 'nature'],
        },
        status: {
          privacyStatus: 'unlisted', // public / unlisted / private
        },
      },
      media: {
        body: fs.createReadStream('final_video.mp4'), // replace with your video file path
      },
    })

    console.log('✅ Video uploaded successfully!')
    console.log(
      'YouTube URL:',
      `https://www.youtube.com/watch?v=${res.data.id}`
    )
  } catch (error) {
    console.log(error)
  }
}
