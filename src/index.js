import { generateVideoWorkflow } from './workflows/generateVideo.js'

async function start() {
  try {
    await generateVideoWorkflow()
    console.log('✅ Done')
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

start()
