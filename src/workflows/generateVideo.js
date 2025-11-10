import { createVideoFromImages } from '../services/videoCreator.js'
import { fetchImageUrls } from '../services/getImagesUrls.js'
import { downloadImages } from '../services/imageDownloader.js'
import { uploadVideo } from '../services/upload.js'
import { ensureProjectDirectories } from '../utils/ensureProjectDirectories.js'

export async function generateVideoWorkflow() {
  ensureProjectDirectories()
  const urls = await fetchImageUrls('nature', 4)

  if (urls.length > 0) {
    await downloadImages(urls)
    await createVideoFromImages()
    await uploadVideo()
  } else {
    console.log('No image URLs fetched')
  }
}
