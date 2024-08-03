const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "randomvideo",
    aliases: ["rv"],
    version: "1.0",
    author: "Vex_kshitiz",
    role: 0,
    shortDescription: { en: "Get a random video from a selected category." },
    longDescription: { en: "Get a random video from a selected category" },
    category: "fun",
    guide: { en: "Use {p}randomvideo to see available categories.\nUse {p}randomvideo <category> to get a random video from the chosen category." }
  },
  onStart: async function ({ api, event, args }) {
    const categories = {
      anime: "anime edit",
      meme: "meme",
      football: "football edit",
      nature: "nature edit",
      aesthetic: "aesthetic video",
       lv: "lyrical video edit"
    };

    if (args.length === 0) {
      const availableCategories = Object.keys(categories).join(", ");
      return api.sendMessage(`Please choose a category:\nAvailable categories: ${availableCategories}`, event.threadID, event.messageID);
    }

    const category = args[0].toLowerCase();

    if (!categories[category]) {
      return api.sendMessage(`Invalid category. Please choose from: ${Object.keys(categories).join(", ")}`, event.threadID, event.messageID);
    }

    try {
      const searchQuery = categories[category];
      const url = `https://lyric-search-neon.vercel.app/kshitiz?keyword=${encodeURIComponent(searchQuery)}`;

      const searchResponse = await axios.get(url);
      const searchResults = searchResponse.data;

      if (searchResults.length === 0) {
        return api.sendMessage(`No results found for category: ${category}`, event.threadID, event.messageID);
      }

      const randomIndex = Math.floor(Math.random() * searchResults.length);
      const selectedVideo = searchResults[randomIndex];
      const videoTitle = selectedVideo.title;
      const videoUrl = selectedVideo.videoUrl;

      const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      const videoPath = path.join(__dirname, 'cache', `randomvideo.mp4`);
      await fs.outputFile(videoPath, videoResponse.data);

      const videoStream = fs.createReadStream(videoPath);
      await api.sendMessage({
        body: ``,
        attachment: videoStream
      }, event.threadID, event.messageID);

      await fs.unlink(videoPath);
    } catch (error) {
      console.error(error);
      return api.sendMessage(`An error occurred while fetching the video.`, event.threadID, event.messageID);
    }
  }
};
