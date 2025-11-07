import { createVideoFromImages } from './create-video.js'
import { downloadImages } from './downloadImages.js'
import { fetchImageUrls } from './getImagesUrls.js'
import { uploadVideo } from './upload.js'
// import { uploadVideoToYouTube } from './uploadToYoutube.js'

// --------------------------------------
// Example usage
// --------------------------------------
// export async function imagesHandler() {
//   // await createVideoFromImages()
//   // console.log('✅ Video created locally at final_video.mp4')

//   try {

//   } catch (error) {
//     console.error('YouTube upload skipped:', error.message)
//     if (error.authUrl) {
//       console.log('Authorize access by visiting:', error.authUrl)
//     }
//   }

//   console.log('🎉 All done!')
// }

export async function imagesHandler() {
  const urls = await fetchImageUrls('nature', 6)

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
