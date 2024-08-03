const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "collage",
    aliases: [],
    version: "1.0",
    author: "Vex_kshitiz",
    shortDescription: "Combine multiple images into one collage",
    longDescription: "Combine multiple images into one collage.",
    category: "image",
    guide: {
      en: "{p}collage"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    try {
      if (event.type !== "message_reply") {
        return message.reply("❌ || Reply to a group of images to create a collage.");
      }

      const attachment = event.messageReply.attachments;
      if (!attachment || attachment.length < 2) {
        return message.reply("❌ || Please reply to at least two images to create a collage.");
      }

      const images = [];
      for (const attach of attachment) {
        if (attach.type === "photo") {
          const imageUrl = attach.url;
          const image = await loadImage(imageUrl);
          images.push(image);
        }
      }

      if (images.length < 2) {
        return message.reply("❌ || Please reply to at least two images to create a collage.");
      }

      let rows, cols;
      if (images.length === 4) {
        cols = 2;
        rows = 2; 
      } else if (images.length % 2 === 0) {
        cols = 4;
        rows = images.length / 4;
      } else {
        cols = 3;
        rows = Math.ceil(images.length / 3);
      }

     
      const canvasWidth = 600; 
      const canvasHeight = 400;
      const cellWidth = canvasWidth / cols;
      const cellHeight = canvasHeight / rows;

      const collageCanvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = collageCanvas.getContext('2d');

    
      for (let i = 0; i < images.length; i++) {
        const colIndex = i % cols;
        const rowIndex = Math.floor(i / cols);
        const offsetX = colIndex * cellWidth;
        const offsetY = rowIndex * cellHeight;
        ctx.drawImage(images[i], offsetX, offsetY, cellWidth, cellHeight);
      }

      const cacheFolderPath = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const collagePath = path.join(cacheFolderPath, `collage.png`);
      const out = fs.createWriteStream(collagePath);
      const stream = collageCanvas.createPNGStream();
      stream.pipe(out);
      out.on('finish', () => {
        message.reply({
          body: "",
          attachment: fs.createReadStream(collagePath)
        });
      });

    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred.");
    }
  }
};
