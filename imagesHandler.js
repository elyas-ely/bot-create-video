import { fetchImageUrls } from './getImagesUrls.js'
import { downloadImages } from './downloadImages.js'

// --------------------------------------
// Example usage
// --------------------------------------
export async function imagesHandler() {
  const urls = await fetchImageUrls('nature', 2)
  console.log('✅ Image URLs fetched:', urls.length)

  await downloadImages(urls)
  console.log('🎉 All done!')
}

// imagesHandler()
