import { generateVideoWorkflow } from './workflows/generateVideo.js'

try {
  await generateVideoWorkflow()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
