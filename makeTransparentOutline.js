const Jimp = require('jimp');

async function processImage() {
  const img = await Jimp.default.read('src/app/template_150.png');
  const width = img.bitmap.width;
  const height = img.bitmap.height;

  // First, make the white area transparent, keep black as black
  img.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    // If pixel is white (main area), make transparent
    if (r > 200 && g > 200 && b > 200) {
      this.bitmap.data[idx + 3] = 0; // alpha = 0 (transparent)
    } else {
      // Otherwise, make sure it's black and fully opaque
      this.bitmap.data[idx + 0] = 0;
      this.bitmap.data[idx + 1] = 0;
      this.bitmap.data[idx + 2] = 0;
      this.bitmap.data[idx + 3] = 255;
    }
  });

  // Optional: Thicken the outline for visibility
  // await img.convolute([
  //   [1, 1, 1],
  //   [1, 1, 1],
  //   [1, 1, 1]
  // ]);

  await img.writeAsync('src/app/template_150_transparent.png');
  console.log('Done! Saved as src/app/template_150_transparent.png');
}

processImage();