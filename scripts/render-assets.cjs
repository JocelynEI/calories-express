const fs = require('node:fs/promises');
const sharp = require('sharp');

async function render(input, output, size, background) {
  let pipeline = sharp(input).resize(size, size, { fit: 'contain', background: background || { r: 0, g: 0, b: 0, alpha: 0 } });
  if (background) pipeline = pipeline.flatten({ background });
  await pipeline.png().toFile(output);
}

(async () => {
  await render('assets/brand-icon.svg', 'assets/icon.png', 1024);
  await render('assets/android-foreground.svg', 'assets/android-icon-foreground.png', 1024);
  await render('assets/android-monochrome.svg', 'assets/android-icon-monochrome.png', 1024);
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#1D1B4B' } }).png().toFile('assets/android-icon-background.png');
  await render('assets/android-foreground.svg', 'assets/splash-icon.png', 512);
  await render('assets/brand-icon.svg', 'assets/favicon.png', 64);
  const outputs = await Promise.all(['icon.png', 'android-icon-foreground.png', 'android-icon-monochrome.png', 'android-icon-background.png', 'splash-icon.png', 'favicon.png'].map(async (name) => ({ name, bytes: (await fs.stat(`assets/${name}`)).size })));
  console.log(outputs);
})();
