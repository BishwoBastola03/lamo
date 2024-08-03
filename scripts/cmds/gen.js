const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "gen",
    aliases: ["gen"],
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 30,
    role: 0,
    longDescription: {
      vi: '',
      en: "Generate images"
    },
    category: "ai",
    guide: {
      vi: '',
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, commandName, event, args }) {
    try {
      api.setMessageReaction("✅", event.messageID, (a) => {}, true);
      const prompt = args.join(' ');

      const response = await axios.get(`https://imagegeneration-kshitiz-6zm7.onrender.com/gen?prompt=${encodeURIComponent(prompt)}`);
      const imageUrls = response.data.response;

      const imgData = [];
      const numberOfImages = 4;

      for (let i = 0; i < Math.min(numberOfImages, imageUrls.length); i++) {
        const imageUrl = imageUrls[i];
        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgPath = path.join(__dirname, 'cache', `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push(fs.createReadStream(imgPath));
      }

      await api.sendMessage({ body: '', attachment: imgData }, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("error contact kshitiz", event.threadID, event.messageID);
    }
  }
};
