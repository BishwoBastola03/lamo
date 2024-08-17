const axios = require("axios");
const fs = require("fs");
const path = require("path");




module.exports = {
  config: {
    name: "xfollow",
    aliases: [],
    author: "Vex_Kshitiz", 
    version: "1.0",
    cooldowns: 5,
    role: 2,
    shortDescription: "Get XFollow corn video ",
    longDescription: "get x follow corn videos.",
    category: "18+",
    guide: "{p}xfollow"
  },

  onStart: async function ({ api, event, args, message }) {



    const apiUrl = "https://x-follow-sigma.vercel.app/kshitiz";

    try {
      const response = await axios.get(apiUrl);
      const { videoUrl, description } = response.data;

      
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
      console.error("Error fetching XFollow video:", error);
      message.reply("Sorry, an error occurred while processing your request.");
    }
  }
};
