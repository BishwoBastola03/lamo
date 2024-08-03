const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const yts = require("yt-search");
const ytdl = require("ytdl-core");

module.exports = {
  sentMusic: {},

  playlistFile: "./playlistvdo.json",

  isPlaying: false,
  config: {
    name: 'playlist',
    version: '3.0',
    author: 'Vex_Kshitiz | Sky',
    countDown: 5,
    role: 0,
    shortDescription: ' ',
    longDescription: 'ultimate video cmd with many features',
    category: 'media',
    guide: {
      en: '{p}{n}',
    }
  },

  loadPlaylist: async function () {
    try {
      const data = await fs.readFile(this.playlistFile, "utf-8");
      this.sentMusic = JSON.parse(data);
    } catch (error) {
      console.error("Error loading playlist:", error);
      this.sentMusic = {};
    }
  },

  savePlaylist: async function () {
    try {
      await fs.writeFile(this.playlistFile, JSON.stringify(this.sentMusic, null, 2));
      console.log("Playlist saved successfully.");
    } catch (error) {
      console.error("Error saving playlist:", error);
    }
  },

  onStart: async function ({ api, event, message, args }) {
    api.setMessageReaction("✅", event.messageID, (err) => {}, true);
    try {
      const senderID = event.senderID;
      await this.loadPlaylist();

      if (args.length === 0) {
        const categoryList = Object.keys(this.sentMusic).join(", ");
        return api.sendMessage(`{P} music <category>\nAvailable categories: ${categoryList}`, event.threadID, null, event.messageID);
      }

      const action = args[0].toLowerCase();

      if (action === "list") {
        const categoryList = Object.keys(this.sentMusic).join(", ");
        return api.sendMessage(`Available categories: ${categoryList}`, event.threadID, null, event.messageID);
      } else if (action === "del") {
        const categoryToDelete = args[1];
        if (!categoryToDelete) {
          return api.sendMessage("Please specify a category to delete.", event.threadID, null, event.messageID);
        }
        if (!this.sentMusic.hasOwnProperty(categoryToDelete)) {
          return api.sendMessage(`${categoryToDelete} not found.`, event.threadID, null, event.messageID);
        }
        delete this.sentMusic[categoryToDelete];
        await this.savePlaylist();
        return api.sendMessage(`${categoryToDelete} deleted successfully.`, event.threadID, null, event.messageID);
      } else if (action === "play") {
        const songName = args.slice(1).join(" ");
        this.playSong(api, event, songName);
        return;
      } else if (action === "on") {
        const category = args[1];
        if (!category || !this.sentMusic.hasOwnProperty(category)) {
          return api.sendMessage("Invalid category.", event.threadID, null, event.messageID);
        }
        this.isPlaying = true;
        this.playMusicFromCategory(api, event, category);
        return;
      } else if (action === "off") {
        this.isPlaying = false;
        return api.sendMessage("Stopped playing video.", event.threadID, null, event.messageID);
      }

      const category = action;

      if (!this.sentMusic.hasOwnProperty(category)) {
        const playlistID = args[2];
        if (!playlistID || !playlistID.startsWith("PL")) {
          return api.sendMessage("Invalid playlistID.", event.threadID, null, event.messageID);
        }
        this.sentMusic[category] = [playlistID];
        await this.savePlaylist();
        return api.sendMessage(`${category} added successfully.`, event.threadID, null, event.messageID);
      }

      const playlistId = this.sentMusic[category][Math.floor(Math.random() * this.sentMusic[category].length)];

      const apiKey = "AIzaSyAO1tuGus4-S8RJID51f8WJAM7LXz1tVNc";

      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=contentDetails&maxResults=50`;
      const response = await axios.get(playlistUrl);

      const items = response.data.items;
      const videoIds = items.map((item) => item.contentDetails.videoId);

      if (this.sentMusic[category].length === videoIds.length) {
        this.sentMusic[category] = [];
      }

      const unwatchedVideoIds = videoIds.filter((videoId) => !this.sentMusic[category].includes(videoId));

      if (unwatchedVideoIds.length === 0) {
        return api.sendMessage("error", event.threadID, null, event.messageID);
      }

      const randomVideoId = unwatchedVideoIds[Math.floor(Math.random() * unwatchedVideoIds.length)];

      this.sentMusic[category].push(randomVideoId);

      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${randomVideoId}&part=snippet`;
      const videoResponse = await axios.get(videoDetailsUrl);

      const videoInfo = videoResponse.data.items[0].snippet;

      const randomVideoTitle = videoInfo.title;

      const cacheFilePath = os.tmpdir() + "/randomVideoTitle.txt";
      fs.writeFileSync(cacheFilePath, randomVideoTitle);

      const searchResults = await yts(randomVideoTitle);

      if (!searchResults.videos.length) {
        return api.sendMessage("No video found.", event.threadID, null, event.messageID);
      }

      const foundVideo = searchResults.videos[0];
      const videoUrl = foundVideo.url;

      const fileName = `bokachoda.mp4`;
      const filePath = __dirname + `/cache/${fileName}`;

      const stream = ytdl(videoUrl, { filter: "audioandvideo" });

      stream.pipe(fs.createWriteStream(filePath));

      stream.on('response', () => {
        console.info('Download started');
      });

      stream.on('info', (info) => {
        console.info(`Downloading ${info.videoDetails.title}`);
      });

      stream.on('end', () => {
        console.info('Downloaded');

        if (fs.statSync(filePath).size > 26214400) {
          fs.unlinkSync(filePath);
          return api.sendMessage('❌ | The file could not be sent because it is larger than 25MB.', event.threadID, null, event.messageID);
        }

        const message = {
          body: ``,
          attachment: fs.createReadStream(filePath)
        };

        api.sendMessage(message, event.threadID, null, event.messageID, () => {
          fs.unlinkSync(filePath);
        });
      });
    } catch (error) {
      console.error('error', error);
      api.sendMessage('To play video, type {p} playlist {category}\nTo add a playlist, type {p} playlist {category} | {playlistID}\nFor example: !playlist nepvideo| PLm_3vnTS-pvnc4wnMI7UYko1uiSX73ahd', event.threadID, null, event.messageID);
    }
  },

  playSong: async function (api, event, songName) {
    try {
      const searchResults = await yts(songName);
      if (!searchResults.videos.length) {
        return api.sendMessage("No video found.", event.threadID, null, event.messageID);
      }
      const foundVideo = searchResults.videos[0];
      const videoUrl = foundVideo.url;
      const fileName = `khankirpola.mp4`;
      const filePath = __dirname + `/cache/${fileName}`;
      const stream = ytdl(videoUrl, { filter: "audioandvideo" });
      stream.pipe(fs.createWriteStream(filePath));
      stream.on('response', () => {
        console.info('Download started');
      });
      stream.on('info', (info) => {
        console.info(`Downloading ${info.videoDetails.title}`);
      });
      stream.on('end', () => {
        console.info('Downloaded');
        if (fs.statSync(filePath).size > 26214400) {
          fs.unlinkSync(filePath);
          return api.sendMessage('❌ | The file could not be sent because it is larger than 25MB.', event.threadID, null, event.messageID);
        }
        const message = {
          body: ``,
          attachment: fs.createReadStream(filePath)
        };
        api.sendMessage(message, event.threadID, null, event.messageID, () => {
          fs.unlinkSync(filePath);
        });
      });
    } catch (error) {
      console.error('Error playing song:', error);
      api.sendMessage('An error occurred while playing the song.', event.threadID, null, event.messageID);
    }
  },

  playMusicFromCategory: async function (api, event, category) {
    try {
      while (this.isPlaying) {
        const playlistIds = this.sentMusic[category];
        if (!playlistIds || playlistIds.length === 0) {
          return api.sendMessage("No playlist found for the given category.", event.threadID, null, event.messageID);
        }
        const playlistId = playlistIds[Math.floor(Math.random() * playlistIds.length)];
        const apiKey = "AIzaSyAO1tuGus4-S8RJID51f8WJAM7LXz1tVNc";

        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=contentDetails&maxResults=50`;
        let response;
        try {
          response = await axios.get(playlistUrl);
        } catch (error) {
          console.error('Error fetching playlist items:', error);
          continue;
        }

        if (response.status === 404) {
          console.error('Playlist items not found.');
          continue;
        }

        const items = response.data.items;
        const videoIds = items.map((item) => item.contentDetails.videoId);

        if (this.sentMusic[category].length === videoIds.length) {
          this.sentMusic[category] = [];
        }

        const unwatchedVideoIds = videoIds.filter((videoId) => !this.sentMusic[category].includes(videoId));

        if (unwatchedVideoIds.length === 0) {
          console.error('No unwatched videos found.');
          continue;
        }

        const randomVideoId = unwatchedVideoIds[Math.floor(Math.random() * unwatchedVideoIds.length)];
        this.sentMusic[category].push(randomVideoId);

        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${randomVideoId}&part=snippet`;
        const videoResponse = await axios.get(videoDetailsUrl);

        const videoInfo = videoResponse.data.items[0].snippet;
        const randomMusicTitle = videoInfo.title;

        const cacheFilePath = os.tmpdir() + "/randomMusicTitle.txt";
        fs.writeFileSync(cacheFilePath, randomMusicTitle);

        const searchResults = await yts(randomMusicTitle);

        if (!searchResults.videos.length) {
          console.error('No music found.');
          continue;
        }

        const foundVideo = searchResults.videos[0];
        const videoUrl = foundVideo.url;

        const fileName = `voday.mp4`;
        const filePath = __dirname + `/cache/${fileName}`;

        const stream = ytdl(videoUrl, { filter: "audioonly" });
        stream.pipe(fs.createWriteStream(filePath));

        stream.on('response', () => {
          console.info('Download started');
        });

        stream.on('info', (info) => {
          console.info(`Downloading ${info.videoDetails.title}`);
        });

        stream.on('end', () => {
          console.info('Downloaded');

          if (fs.statSync(filePath).size > 26214400) {
            fs.unlinkSync(filePath);
            return api.sendMessage('❌ | The file could not be sent because it is larger than 25MB.', event.threadID, null, event.messageID);
          }

          const message = {
            body: ``,
            attachment: fs.createReadStream(filePath)
          };

          api.sendMessage(message, event.threadID, null, event.messageID, () => {
            fs.unlinkSync(filePath);
          });
        });

        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
      }
    } catch (error) {
      console.error('Error playing music from category:', error);
      api.sendMessage('An error occurred while playing video', event.threadID, null, event.messageID);
    }
  }
};
