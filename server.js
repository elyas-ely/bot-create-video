import { createVideoFromImages } from './create-video.js'
import { downloadImages } from './downloadImages.js'
import { fetchImageUrls } from './getImagesUrls.js'
import { uploadVideo } from './upload.js'

export async function imagesHandler() {
  const urls = await fetchImageUrls('nature', 4)

  if (urls.length > 0) {
    await downloadImages(urls)
    await createVideoFromImages()
    await uploadVideo()
    console.log('🎉 All done!')
  } else {
    console.log('❌ No image URLs fetched')
  }
}

imagesHandler()
