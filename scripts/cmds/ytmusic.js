const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { shortenURL } = global.utils;

const API_URL = "https://yt-music-7ind.onrender.com/search?query=";

async function downloadVideo(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function ytmusic(api, event, args, message) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);

    try {
        let title = '';
        let shortUrl = '';
        let videoUrl = '';
        let videoId = '';

        const extractShortUrl = async () => {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type === "video" || attachment.type === "audio") {
                return attachment.url;
            } else {
                throw new Error("Invalid attachment type.");
            }
        };

        if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
            shortUrl = await extractShortUrl();
            const musicRecognitionResponse = await axios.get(`https://audio-recon-ahcw.onrender.com/kshitiz?url=${encodeURIComponent(shortUrl)}`);
            title = musicRecognitionResponse.data.title;
            const searchResponse = await axios.get(`${API_URL}${encodeURIComponent(title)}`);
            videoUrl = searchResponse.data.videoUrl;
        } else if (args.length === 0) {
            message.reply("Please provide music name or reply to a video or audio attachment.");
            return;
        } else {
            title = args.join(" ");
            const searchResponse = await axios.get(`${API_URL}${encodeURIComponent(title)}`);
            videoUrl = searchResponse.data.videoUrl;
        }

        if (!videoUrl) {
            message.reply("No video found for the given query.");
            return;
        }

        const cachePath = path.join(__dirname, "cache", `video.mp3`);
        await downloadVideo(videoUrl, cachePath);

        const audioStream = fs.createReadStream(cachePath);
        message.reply({ body: `📹 Playing: ${title}`, attachment: audioStream });
        api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
        console.error("Error:", error);
        message.reply("An error occurred.");
    }
}

module.exports = {
    config: {
        name: "ytmusic", 
        version: "1.0",
        author: "Vex_Kshitiz",
        countDown: 10,
        role: 0,
        shortDescription: "Play audio from YouTube Music",
        longDescription: "play audio from YouTube Music.",
        category: "music",
        guide: "{p} ytmusic <music name> / reply to audio or video"
    },
    onStart: function ({ api, event, args, message }) {
        return ytmusic(api, event, args, message);
    }
};
