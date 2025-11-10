import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

const FFMPEG = 'ffmpeg'
const FFPROBE = 'ffprobe'

export async function checkFFmpeg() {
  try {
    await execAsync(`${FFMPEG} -version`)
    await execAsync(`${FFPROBE} -version`)
  } catch (err) {
    console.error(`❌ FFmpeg/FFprobe not found. Install them before running.`)
    process.exit(1)
  }
}
