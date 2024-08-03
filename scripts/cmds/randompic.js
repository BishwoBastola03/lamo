const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "randompic",
    aliases: [],
    version: "1.0",
    author: "Vex_kshitiz",
    role: 0,
    shortDescription: { en: "Get a random picture from a selected category." },
    longDescription: { en: "Get a random picture from a selected category" },
    category: "fun",
    guide: { en: "Use {p}randompic to see available categories.\nUse {p}randompic <category> to get a random picture from the chosen category." }
  },
  onStart: async function ({ api, event, args }) {
    const categories = {
      boy: "grunge boy pfp",
      girl: "grunge girl pfp",
      anime: "anime",
      nature: "nature",
      car: "car"
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
      const url = `https://pin-two.vercel.app/pin?search=${encodeURIComponent(searchQuery)}`;

      const searchResponse = await axios.get(url);
      const searchResults = searchResponse.data.result;

      if (searchResults.length === 0) {
        return api.sendMessage(`No results found for category: ${category}`, event.threadID, event.messageID);
      }

      const randomIndex = Math.floor(Math.random() * searchResults.length);
      const imageUrl = searchResults[randomIndex];

      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imagePath = path.join(__dirname, 'cache', `randompic_image.jpg`);
      await fs.outputFile(imagePath, imageResponse.data);

      const imageStream = fs.createReadStream(imagePath);
      await api.sendMessage({
        body: ``,
        attachment: imageStream
      }, event.threadID, event.messageID);

      await fs.unlink(imagePath);
    } catch (error) {
      console.error(error);
      return api.sendMessage(`An error occurred while fetching the picture.`, event.threadID, event.messageID);
    }
  }
};
