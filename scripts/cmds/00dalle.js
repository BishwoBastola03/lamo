const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const apiEndpoint = 'https://api.cracked.systems/v1/images/generations';
const headers = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer Vy3QaRMyQu8rKypX' 
};

async function generateImages(prompt) {
  const data = {
    model: 'dall-e-3',
    prompt,
    n: 2
  };

  try {
    const response = await axios.post(apiEndpoint, data, { headers });
    return response.data.data.map(image => image.url);
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  config: {
    name: "dalle",
    version: "1.0.1",
    author: "Shikaki",
    role: 0,
    countDown: 30,
    description: {
      en: "Use if you want to generate detailed or complex images.",
    },
    category: "Image-gen-ai",
    guide: {
      en: "{pn} A cat saying 'Go and sleep'",
    },
  },
  onStart: async function ({ api, event, message, args }) {
    const prompt = args.join(" ");

    api.setMessageReaction("⌛", event.messageID, () => { }, true);

    try {
      const urls = await generateImages(prompt);

      if (!urls || urls.length === 0) {
        throw new Error("No images were generated");
      }

      const tmpDir = path.join(__dirname, 'tmp');

      const imgData = [];

      for (let i = 0; i < urls.length; i++) {
        const imgResponse = await axios.get(urls[i], { responseType: 'arraybuffer' });
        const imgPath = path.join(tmpDir, `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push(fs.createReadStream(imgPath));
      }

      await message.reply({
        attachment: imgData
      });

      await fs.remove(tmpDir);

      api.setMessageReaction("✅", event.messageID, () => { }, true);
    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID, () => { }, true);
      return message.reply(`An error occurred: ${error.message}`);
    }
  }
}
