const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "ascart",
    aliases: ["asciiart"],
    version: "1.0",
    author: "Vex_Kshitiz",
    shortDescription: "Convert images to ASCII art",
    longDescription: "Convert images to ASCII art.",
    category: "image",
    guide: {
      en: "{p}ascart"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    try {
      if (event.type !== "message_reply") {
        return message.reply("❌ || Reply to an image.");
      }

      const attachment = event.messageReply.attachments;
      if (!attachment || attachment.length !== 1 || attachment[0].type !== "photo") {
        return message.reply("❌ || Please reply to a single image.");
      }

      const imageUrl = attachment[0].url;
      const image = await loadImage(imageUrl);

      const asciiArt = generateAsciiArt(image, image.width, image.height);
      const asciiArtTextFilePath = path.join(__dirname, 'cache', 'ascart_ascii_art.txt');
      fs.writeFileSync(asciiArtTextFilePath, asciiArt);

      const asciiArtImage = await createAsciiArtImage(asciiArt, image.width, image.height);
      const cacheFolder = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheFolder)) {
        fs.mkdirSync(cacheFolder);
      }
      const asciiArtImagePath = path.join(cacheFolder, 'ascart_ascii_art.png');
      fs.writeFileSync(asciiArtImagePath, asciiArtImage);

     
      message.reply({
        body: ``,//  body: `${asciiArt}`, do this to include ascii art characters in image body
        attachment: fs.createReadStream(asciiArtImagePath)
      }, {
        attachment: fs.createReadStream(asciiArtTextFilePath),
        filename: "ascart_ascii_art.txt"
      });

    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred.");
    }
  }
};

function generateAsciiArt(image, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  const asciiChars = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.'];

  let asciiArt = '';

  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 4) {
      const pixelData = ctx.getImageData(x, y, 4, 8).data;
      const avgBrightness = getAverageBrightness(pixelData);

      const asciiIndex = Math.floor(avgBrightness / 25.5);
      asciiArt += asciiChars[asciiIndex];
    }
    asciiArt += '\n';
  }

  return asciiArt;
}

function getAverageBrightness(pixelData) {
  let totalBrightness = 0;
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    
    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalBrightness += brightness;
  }

 
  return totalBrightness / (pixelData.length / 4);
}

async function createAsciiArtImage(asciiArt, width, height) {
  const fontSize = Math.max(1, Math.min(width / asciiArt.split('\n')[0].length, height / asciiArt.split('\n').length));
  const canvasWidth = Math.ceil(fontSize * asciiArt.split('\n')[0].length);
  const canvasHeight = Math.ceil(fontSize * asciiArt.split('\n').length);

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  
  ctx.font = `${fontSize}px Courier`;
  ctx.fillStyle = '#000000';

 
  const horizontalOffset = Math.max(0, Math.floor((canvasWidth - fontSize * asciiArt.split('\n')[0].length) / 2));

  
  asciiArt.split('\n').forEach((line, i) => {
    ctx.fillText(line, horizontalOffset, (i + 1) * fontSize);
  });

 
  const finalCanvas = createCanvas(canvasWidth, canvasHeight);
  const finalCtx = finalCanvas.getContext('2d');

  
  finalCtx.fillStyle = '#FFFFFF';
  finalCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  
  finalCtx.drawImage(canvas, 0, 0);

  
  const croppedCanvas = createCanvas(canvasWidth - 200, canvasHeight); 
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(finalCanvas, 0, 0, canvasWidth - 100, canvasHeight, 0, 0, canvasWidth - 100, canvasHeight);

  return croppedCanvas.toBuffer('image/png');
}
