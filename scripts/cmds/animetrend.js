const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function fetchTrendingAnime() {
  try {
    const response = await axios.get("https://anime-trending-six.vercel.app/kshitiz");
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch trending anime list");
  }
}

async function downloadTrailer(videoUrl, fileName) {
  try {
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const response = await axios.get(videoUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(fileName);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(fileName));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to download video");
  }
}

async function fetchTrailerDownloadUrl(videoId) {
  try {
    const response = await axios.get(`https://youtube-kshitiz.vercel.app/download?id=${videoId}`);
    return response.data[0];
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch trailer download URL");
  }
}

module.exports = {
  config: {
    name: "animetrend",
    aliases: ["anitrend"],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Get trending anime list",
    longDescription: "Get trending anime list",
    category: "anime",
    guide: "{p}animetrend",
  },

  onStart: async function ({ api, event }) {
    api.setMessageReaction("🕐", event.messageID, () => {}, true);

    try {
      const animeList = await fetchTrendingAnime();

      if (!Array.isArray(animeList) || animeList.length === 0) {
        api.sendMessage({ body: "No trending anime found." }, event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return;
      }

      const top10Anime = animeList.slice(0, 10);
      const animeNames = top10Anime.map((anime, index) => `${index + 1}. ${anime.name}`).join("\n");
      const message = `Top 10 Trending Animes:\n\n${animeNames}`;

      api.sendMessage({ body: message }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "animetrend",
          messageID: info.messageID,
          author: event.senderID,
          animeList: top10Anime,
        });
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred. Please try again later." }, event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, animeList } = Reply;

    if (event.senderID !== author || !animeList) {
      return;
    }

    const animeIndex = parseInt(args[0], 10);

    if (isNaN(animeIndex) || animeIndex <= 0 || animeIndex > animeList.length) {
      api.sendMessage({ body: "Invalid input. Please provide a valid number." }, event.threadID, event.messageID);
      return;
    }

    const selectedAnime = animeList[animeIndex - 1];
    const trailerId = selectedAnime.trailer && selectedAnime.trailer.id;

    if (!trailerId) {
      api.sendMessage({ body: "The trailer of this anime is not available." }, event.threadID, event.messageID);
      global.GoatBot.onReply.delete(event.messageID);
      return;
    }

    try {
      const downloadUrl = await fetchTrailerDownloadUrl(trailerId);
      const videoFileName = path.join(__dirname, 'cache', `anitrend.mp4`);
      await downloadTrailer(downloadUrl, videoFileName);
      const videoStream = fs.createReadStream(videoFileName);

      api.sendMessage({ body: `${selectedAnime.name}`, attachment: videoStream }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred." }, event.threadID, event.messageID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },
};