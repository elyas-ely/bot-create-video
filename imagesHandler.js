import { fetchImageUrls } from './getImagesUrls.js'
import { downloadImages } from './downloadImages.js'
import { createVideoFromImages } from './create-video.js'
import { clearChunks } from './clearChunks.js'

// --------------------------------------
// Example usage
// --------------------------------------
// export async function imagesHandler() {
//   await createVideoFromImages()
//   console.log('🎉 All done!')
// }

export async function imagesHandler() {
  const urls = await fetchImageUrls('nature', 100)

  if (urls.length > 0) {
    await downloadImages(urls)
    await createVideoFromImages()
    console.log('🎉 All done!')
  } else {
    console.log('❌ No image URLs fetched')
  }
}

imagesHandler()
