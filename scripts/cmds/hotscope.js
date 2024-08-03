const axios = require("axios");
const fs = require("fs");
const path = require("path");


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
    name: "hotscope",
    aliases: [],
    author: "Vex_Kshitiz", 
    version: "1.0",
    cooldowns: 5,
    role: 2,
    shortDescription: "nsfw corn videos",
    longDescription: "nsfw cienb videos.",
    category: "18+",
    guide: "{p}hotscope {search}"
  },

  onStart: async function ({ api, event, args, message }) {
  
    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      await message.reply("Author changer alert! This command belongs to Vex_Kshitiz.");
      return;
    }

    if (args.length === 0) {
    
      message.reply("Please provide a search query. Usage: {p}hotscope {search}");
      return;
    }

    const searchQuery = encodeURIComponent(args.join(" "));
    const apiUrl = `https://pin-corn-sage.vercel.app/kshitiz?query=${searchQuery}`;

    try {
      const response = await axios.get(apiUrl);
      const videoUrl = response.data.video;

      
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
      console.error("Error fetching hotscope video:", error);
      message.reply("Sorry, an error occurred while processing your request.");
    }
  }
};
