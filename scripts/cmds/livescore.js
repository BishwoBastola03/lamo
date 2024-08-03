const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function checkAuthor(authorName) {
  try {
    const response = await axios.get('https://author-check.vercel.app/name');
    const apiAuthor = response.data.name;
    return apiAuthor === authorName;
  } catch (error) {
    console.error("Error checking author:", error);
    return false;
  }
}

module.exports = {
  config: {
    name: "livescore",
    aliases: [],
    version: "1.0",
    author: "Vex_Kshitiz",
    shortDescription: "watch live cricket scores",
    longDescription: "watch live cricket scores",
    category: "cricket",
    guide: {
      en: "{p}livescore"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    try {
      const isAuthorValid = await checkAuthor(module.exports.config.author);
      if (!isAuthorValid) {
        await message.reply("Author changer alert! this cmd belongs to Vex_Kshitiz.");
        return;
      }

      const response = await axios.get('https://cricket-kshitiz.vercel.app/today', { responseType: 'arraybuffer' });
      const imageData = response.data;

      const cacheFolderPath = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, 'livescore.jpg');
      fs.writeFileSync(imagePath, imageData);


      const crop = {
        top: 300,
        bottom: 320,
        left: 200,
        right: 30
      };

      const image = await loadImage(imagePath);

      const canvas = createCanvas(image.width - crop.left - crop.right, image.height - crop.top - crop.bottom);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, crop.left, crop.top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

      const croppedImagePath = path.join(cacheFolderPath, 'livescore_cropped.jpg');
      const out = fs.createWriteStream(croppedImagePath);
      const stream = canvas.createJPEGStream();
      stream.pipe(out);

      out.on('finish', () => {

        message.reply({
          body: "",
          attachment: fs.createReadStream(croppedImagePath)
        });
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred while fetching the live cricket score.");
    }
  }
};