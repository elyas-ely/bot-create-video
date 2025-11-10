import { createVideoFromImages } from '../services/videoCreator.js'
import { fetchImageUrls } from '../services/getImagesUrls.js'
import { downloadImages } from '../services/imageDownloader.js'
import { uploadVideo } from '../services/upload.js'
import { ensureProjectDirectories } from '../utils/ensureProjectDirectories.js'
import {
  emptyChunksFolder,
  emptyImagesFolder,
  emptyFinalFolder,
} from '../utils/cleanup.js'

export async function generateVideoWorkflow() {
  ensureProjectDirectories()
  const urls = await fetchImageUrls('nature', 4)

  if (urls.length === 0) {
    console.log('No image URLs fetched')
    return
  }

  try {
    await downloadImages(urls)
    await createVideoFromImages()
    await uploadVideo()
  } finally {
    emptyChunksFolder()
    emptyImagesFolder()
    emptyFinalFolder()
  }
}
