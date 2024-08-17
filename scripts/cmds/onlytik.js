const { GoatWrapper } = require('fca-liane-utils');
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Function to check if the author matches


module.exports = {
  config: {
    name: "onlytik",
    aliases: [],
    author: "Vex_Kshitiz", 
    version: "1.0",
    cooldowns: 5,
    role: 2,
    shortDescription: "18+ tiktok video",
    longDescription: "18+ tiktok video",
    category: "18+",
    guide: "{p}onlytik"
  },

  onStart: async function ({ api, event, args, message }) {
    
    
    const apiUrl = "https://only-tik.vercel.app/kshitiz";

    try {
      const response = await axios.get(apiUrl);
      const { videoUrl, likes } = response.data;

     
      const tempVideoPath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempVideoPath);
      const videoResponse = await axios.get(videoUrl, { responseType: "stream" });
      videoResponse.data.pipe(writer);

      writer.on("finish", () => {
        const stream = fs.createReadStream(tempVideoPath);

        message.reply({
          body: ``,
          attachment: stream,
        });
      });

    } catch (error) {
      console.error("Error fetching OnlyTik video:", error);
      message.reply("Sorry, an error occurred while processing your request.");
    }
  }
};
const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });