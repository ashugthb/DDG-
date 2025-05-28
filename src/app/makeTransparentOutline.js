// Save as makeTransparentOutline.js
const Jimp = require('jimp');

async function processImage() {
  const img = await Jimp.read('template_150.png');
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    // If pixel is white, make transparent
    if (r > 200 && g > 200 && b > 200) {
      this.bitmap.data[idx + 3] = 0;
    } else {
      // Make outline black
      this.bitmap.data[idx + 0] = 0;
      this.bitmap.data[idx + 1] = 0;
      this.bitmap.data[idx + 2] = 0;
      this.bitmap.data[idx + 3] = 255;
    }
  });
  await img.writeAsync('template_150_outline.png');
  console.log('Done! Saved as template_150_outline.png');
}

processImage();