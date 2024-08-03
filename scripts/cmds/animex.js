const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "animex",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate anime image based on prompt.",
    longDescription: "Generates an anime image based on the provided prompt.",
    category: "fun",
    guide: "{p}animex <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
     api.setMessageReaction("✨", event.messageID, (err) => {}, true);  
    try {
      const prompt = args.join(" ");
      const animexApiUrl = `https://imagegeneration-kshitiz-6846.onrender.com/animex?prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(animexApiUrl, {
        responseType: "arraybuffer"
      });

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `anime_image.png`);
      fs.writeFileSync(imagePath, response.data);

      message.reply({
        body: "",
        attachment: fs.createReadStream(imagePath) 
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("provide a prompt to gen image.");
    }
  }
};
