const axios = require("axios");
const fs = require("fs");
const ffmpeg = require('ffmpeg-static');
const { shortenURL } = global.utils; 

async function fetchHentaiEpisodes(searchTerm) {
  try {
    const response = await axios.get(`https://kshitiz-donn.vercel.app/search/${encodeURIComponent(searchTerm)}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch hentai episodes");
  }
}

async function fetchEpisodeVideo(episodeName) {
  try {
    const response = await axios.get(`https://kshitiz-donn.vercel.app/video/${encodeURIComponent(episodeName)}`);
    return response.data.videoUrl;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch episode video");
  }
}

async function trimVideo(videoPath, trimmedPath, startSeconds, duration) {
  const ffmpegCommand = [
    '-i', videoPath,
    '-ss', startSeconds.toString(),
    '-t', duration.toString(),
    '-c', 'copy',
    trimmedPath
  ];
  await new Promise((resolve, reject) => {
    const childProcess = require('child_process').spawn(ffmpeg, ffmpegCommand);
    childProcess.on('close', resolve);
    childProcess.on('error', reject);
  });
}

module.exports = {
  config: {
    name: "hentai",
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Watch hentai",
    longDescription: "Get hentai episode download links",
    category: "Hentai",
    guide: "{p}henyai <search_term>",
  },

  onStart: async function ({ api, event, args }) {
    const searchTerm = args.join(" ");

    if (!searchTerm) {
      api.sendMessage({ body: "Please provide a search term for hentai episodes." }, event.threadID, event.messageID);
      return;
    }

    try {
      const episodes = await fetchHentaiEpisodes(searchTerm);

      if (!episodes || episodes.length === 0) {
        api.sendMessage({ body: `No hentai episodes found for: ${searchTerm}` }, event.threadID, event.messageID);
        return;
      }

      const episodeListMessage = episodes.map((episode, index) => `${index + 1}. ${episode}`).join("\n");
      const message = `Reply to this message with the episode number:\n${episodeListMessage}`;

      api.sendMessage({ body: message }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "hentai",
          messageID: info.messageID,
          episodes,
        });
      });
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "Sorry, an error occurred while processing your request." }, event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { episodes } = Reply;
    const episodeIndex = parseInt(args[0], 10);

    if (isNaN(episodeIndex) || episodeIndex <= 0 || episodeIndex > episodes.length) {
      api.sendMessage({ body: "Invalid input.\nPlease provide a valid episode number." }, event.threadID, event.messageID);
      return;
    }

    const selectedEpisode = episodes[episodeIndex - 1];
    const episodeName = selectedEpisode.replace(/\/$/, "");

    try {
      const videoUrl = await fetchEpisodeVideo(episodeName);
      const shortenedVideoUrl = await shortenURL(videoUrl);

      const cacheFilePath = __dirname + `/cache/hentai_${Date.now()}.mp4`;
      const videoResponse = await axios({
        method: 'GET',
        url: shortenedVideoUrl,
        responseType: 'stream'
      });

      const writeStream = fs.createWriteStream(cacheFilePath);

      videoResponse.data.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      await this.trimAndSendVideo(api, event, cacheFilePath);

    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred while processing the episode.\nPlease try again later." }, event.threadID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },

  trimAndSendVideo: async function (api, event, videoPath) {
    try {
      const parts = [
        { start: 0, duration: 360 },  
        { start: 360, duration: 360 },
        { start: 720, duration: 360 }, 
        { start: 1080, duration: 360 }
      ];

      const promises = parts.map(async (part, index) => {
        const trimmedPath = `${videoPath.replace('.mp4', `_${index + 1}.mp4`)}`;
        await trimVideo(videoPath, trimmedPath, part.start, part.duration);

        if (fs.existsSync(trimmedPath)) {
          const stream = fs.createReadStream(trimmedPath);
          api.sendMessage({
            body: `Part ${index + 1}`,
            attachment: stream
          }, event.threadID);
        } else {
          throw new Error(`Trimmed video part ${index + 1} does not exist.`);
        }
      });

      await Promise.all(promises);

    } catch (error) {
      console.error("Error while trimming and sending video:", error);
      api.sendMessage({ body: "An error occurred while processing the episode.\nPlease try again later." }, event.threadID);
    }
  },

 
};
