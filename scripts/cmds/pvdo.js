const axios = require("axios");
const { getStreamFromURL, shortenURL, randomString } = global.utils;

module.exports = {
  config: {
    name: "pvdo",
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Search for corny videos",
    longDescription: "search for corny videos",
    category: "18+",
    guide: "{p}pvdo <search_query>",
  },

  onStart: async function ({ api, event, args }) {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      api.sendMessage({ body: "Please provide a search query." }, event.threadID, event.messageID);
      return;
    }

    try {
      const response = await axios.get(`https://p-vdo.vercel.app/kshitiz?search=${encodeURIComponent(searchQuery)}`);
      const videos = response.data.slice(0, 5);

      if (!videos || videos.length === 0) {
        api.sendMessage({ body: "No videos found." }, event.threadID, event.messageID);
        return;
      }

      let message = "Here are the top 5 videos:\n";
      for (const video of videos) {
        const { title, videoUrl } = video;
        const shortenedURL = await shortenURL(videoUrl);

        message += `\nTitle: ${title}\nPlayableUrl ${shortenedURL}\n`;
      }

      api.sendMessage({ body: message }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred." }, event.threadID, event.messageID);
    }
  },
};
