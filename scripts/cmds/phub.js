const axios = require("axios");
const { shortenURL } = global.utils; 

module.exports = {
  config: {
    name: "phub",
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Search for cornhub video",
    longDescription: "Search for videos on cornhub.",
    category: "18+",
    guide: "{p}phub <search_query>",
  },

  onStart: async function ({ api, event, args }) {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      api.sendMessage({ body: "Please provide a search query." }, event.threadID, event.messageID);
      return;
    }

    try {
      const response = await axios.get(`https://p-hub-beta.vercel.app/kshitiz?query=${encodeURIComponent(searchQuery)}`);
      const videoURLs = response.data;

      if (!videoURLs || videoURLs.length === 0) {
        api.sendMessage({ body: "No videos found." }, event.threadID, event.messageID);
        return;
      }

      let message = "Here are the top 5 videos:\n";
      for (let i = 0; i < Math.min(5, videoURLs.length); i++) {
        const originalURL = videoURLs[i];
        const shortenedURL = await shortenURL(originalURL);

        message += `\nVideo ${i + 1}: ${shortenedURL}\n`;
      }

      api.sendMessage({ body: message }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred." }, event.threadID, event.messageID);
    }
  },
};
