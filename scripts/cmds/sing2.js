module.exports = {
  config: {
    name: "sing",
    version: "10.5.1",
    role: 0,
    author: "Priyanshi Kaur || ArYAN", // don't change author credits.
    countDown: 5,
    shortDescription: "Play or Download Songs by Name or YouTube Link",
    category: "media",
    guide: {
       en: "{p}sing <Song Name> | .sing <YouTube Song URL>",
    },
    dependencies: {
      "fs-extra": "",
      "axios": "",
      "ytdl-core": "",
      "yt-search": ""
    }
  },

  onStart: async ({ api, event }) => {
    const axios = require("axios");
    const fs = require("fs-extra");
    const ytdl = require("ytdl-core");
    const yts = require("yt-search");

    const input = event.body;
    const text = input.substring(6).trim(); // Adjust if the command prefix is different

    if (!text) {
      return api.sendMessage("Please provide a song name or a YouTube URL.", event.threadID);
    }

    try {
      api.sendMessage(`🌐 | Searching for "${text}".\n♻ | Please wait...🖤`, event.threadID, event.messageID);

      let songUrl;
      let songTitle;
      let songArtist;
      let songDuration;
      let songViews;

      if (ytdl.validateURL(text)) {
        songUrl = text;
        const info = await ytdl.getInfo(songUrl);
        songTitle = info.videoDetails.title;
        songArtist = info.videoDetails.author.name;
        songDuration = info.videoDetails.lengthSeconds;
        songViews = info.videoDetails.viewCount;
      } else {
        const searchResults = await yts(text);
        const song = searchResults.videos.length > 0 ? searchResults.videos[0] : null;

        if (!song) {
          return api.sendMessage("Error: Song not found.", event.threadID);
        }

        songUrl = song.url;
        songTitle = song.title;
        songArtist = song.author.name;
        songDuration = song.duration.seconds;
        songViews = song.views;
      }

      let lyrics = "Lyrics not found!";
      try {
        const lyricsResponse = await axios.get(`https://global-sprak.onrender.com/api/lyrics?songName=${encodeURIComponent(text)}`);
        if (lyricsResponse.data.lyrics) {
          lyrics = lyricsResponse.data.lyrics;
        }
      } catch (lyricsError) {
        console.error('[ERROR fetching lyrics]', lyricsError);
      }

      const stream = ytdl(songUrl, { filter: "audioonly" });
      const fileExtension = 'mp3';
      const fileName = `${event.senderID}.${fileExtension}`;
      const filePath = __dirname + `/cache/${fileName}`;
      stream.pipe(fs.createWriteStream(filePath));

      stream.on('response', () => {
        console.info('[DOWNLOADER]', 'Starting download now!');
      });

      stream.on('info', (info) => {
        console.info('[DOWNLOADER]', `Downloading ${info.videoDetails.title} by ${info.videoDetails.author.name}`);
      });

      stream.on('end', async () => {
        console.info('[DOWNLOADER] Downloaded');

        if (fs.statSync(filePath).size > 26214400) { // 25 MB limit
          fs.unlinkSync(filePath);
          return api.sendMessage('[ERR] The file could not be sent because it is larger than 25MB.', event.threadID);
        }

        const message = {
          body: `👑 𝗧𝗶𝘁𝗹𝗲: ${songTitle}\n🎩 𝗔𝗿𝘁𝗶𝘀𝘁: ${songArtist}\n⏰ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${Math.floor(songDuration / 60)}:${songDuration % 60}\n👀 𝗩𝗶𝗲𝘄𝘀: ${songViews}\n\n━━━━━━━━━━━━━\n🎶 𝗟𝗬𝗥𝗜𝗖𝗦\n${lyrics}`,
          attachment: fs.createReadStream(filePath)
        };

        api.sendMessage(message, event.threadID, () => {
          fs.unlinkSync(filePath);
        });
      });

    } catch (error) {
      console.error('[ERROR]', error);
      api.sendMessage('Please try again later. An error occurred.', event.threadID, event.messageID);
    }
  }
};