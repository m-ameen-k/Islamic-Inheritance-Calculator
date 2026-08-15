import sharp from "sharp";
import fs from "fs";

const inputPath = "assets/icons/icon.png";
const outputDir = "public/icons";
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const generateIcon = (size: number, outputPath: string) => {
  const padding = Math.max(1, Math.round(size * 0.1));
  const artworkSize = size - padding * 2;

  return sharp(inputPath)
    .trim({ background: transparent })
    .resize(artworkSize, artworkSize, {
      fit: "contain",
      background: transparent,
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: transparent,
    })
    .png()
    .toFile(outputPath);
};

// Generate favicon sizes
const sizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 144, 152, 180, 192, 512];
const promises = sizes.map((size) => {
  return generateIcon(size, `${outputDir}/icon-${size}x${size}.png`);
});

// Generate browser and Apple touch icon files
Promise.all([
  ...promises,
  generateIcon(16, `${outputDir}/favicon-16x16.png`),
  generateIcon(32, `${outputDir}/favicon-32x32.png`),
  generateIcon(180, `${outputDir}/apple-touch-icon.png`),
]).then(() => {
  console.log("✅ Favicon variants generated successfully!");
});
