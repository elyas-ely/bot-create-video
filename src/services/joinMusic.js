import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const FFMPEG = 'ffmpeg'
const BATCH_SIZE = 5
const CHUNK_DURATION = 5
const FADE_DURATION = 0.5

async function runFFmpeg(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd)
    return stdout
  } catch (err) {
    console.error('❌ FFmpeg error:', err.message)
    throw err
  }
}

function chunkArray(arr, size) {
  const batches = []
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size))
  }
  return batches
}

async function mergeBatch(batchFiles, batchIndex, tempDir) {
  console.log(`🔄 Starting batch ${batchIndex}...`)

  batchFiles.sort((a, b) => {
    const numA = parseInt(a.match(/chunk_(\d+)/)?.[1] || '0')
    const numB = parseInt(b.match(/chunk_(\d+)/)?.[1] || '0')
    return numA - numB
  })

  const inputs = batchFiles.map((f) => `-i "${f}"`).join(' ')

  let filter = ''
  let lastStream = '[0:v]'
  let offset = CHUNK_DURATION - FADE_DURATION

  for (let i = 1; i < batchFiles.length; i++) {
    const outStream = `[v${i}]`
    filter += `${lastStream}[${i}:v]xfade=transition=fade:duration=${FADE_DURATION}:offset=${offset}${outStream};`
    lastStream = outStream
    offset += CHUNK_DURATION - FADE_DURATION
  }

  filter += `${lastStream}scale=-1:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p[vid]`

  const batchOutput = path.join(tempDir, `batch_${batchIndex}.mp4`)
  const cmd = `${FFMPEG} -y ${inputs} -filter_complex "${filter}" -map "[vid]" -c:v libx264 -preset veryfast -crf 23 "${batchOutput}"`

  console.log(`🎬 FFmpeg merging batch ${batchIndex}...`)
  await runFFmpeg(cmd)

  console.log(`✅ Batch ${batchIndex} completed`)
  return batchOutput
}

export async function joinChunksWithMusic(
  chunkFiles,
  output = 'public/final/final_video.mp4',
  audioFile = 'public/audio/music.mp3'
) {
  const tempDir = path.join(path.dirname(output), 'temp_batches')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  console.log(`📁 Preparing batches...`)

  const batches = chunkArray(chunkFiles, BATCH_SIZE)
  const totalBatches = batches.length
  const batchOutputs = []

  for (let i = 0; i < batches.length; i++) {
    const percent = (((i + 1) / totalBatches) * 100).toFixed(1)
    console.log(`📦 Processing batch ${i + 1}/${totalBatches} (${percent}%)`)

    const batchOutput = await mergeBatch(batches[i], i, tempDir)
    batchOutputs.push(batchOutput)
  }

  console.log(`🔗 All batches processed. Preparing final merge...`)

  const listFile = path.join(tempDir, 'batch_list.txt')
  fs.writeFileSync(
    listFile,
    batchOutputs.map((f) => `file '${path.resolve(f)}'`).join('\n')
  )

  const intermediateOutput = path.join(tempDir, 'merged_batches.mp4')
  const concatCmd = `${FFMPEG} -y -f concat -safe 0 -i "${listFile}" -c copy "${intermediateOutput}"`

  console.log(`⏳ Concatenating all batches (90%)...`)
  await runFFmpeg(concatCmd)

  const finalAudioCmd = `${FFMPEG} -y -i "${intermediateOutput}" -stream_loop -1 -i "${audioFile}" -c:v copy -c:a aac -b:a 192k -shortest "${path.resolve(output)}"`

  console.log(`🎵 Adding music (95%)...`)
  await runFFmpeg(finalAudioCmd)

  fs.rmSync(tempDir, { recursive: true, force: true })

  console.log(`🎉 100% COMPLETED → Final video ready at: ${output}`)

  return output
}
