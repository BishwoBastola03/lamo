const axios = require("axios");
const fs = require("fs-extra");
const { getStreamFromURL, shortenURL, randomString } = global.utils;

module.exports = {
  config: {
    name: "fb",
    version: "1.0",
    author: "Vex_kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "",
    longDescription: "Download private video or audio of fb",
    category: "𝗠𝗘𝗗𝗜𝗔",
    guide: "{p}fb a {link} / v {link} ",
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (args[0] === "a") {
        const audioPath = __dirname + `/cache/abdul.mp3`;
        let audioData = (await axios.get(event.attachments[0].playableUrl, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(audioPath, Buffer.from(audioData, "binary"));

        const shortUrl = await shortenURL(event.attachments[0].playableUrl); 
        return api.sendMessage(
          {
            body: `Here is your request ✅\n🔗 Download Url: ${shortUrl}`,
            attachment: fs.createReadStream(audioPath),
          },
          event.threadID,
          () => fs.unlinkSync(audioPath),
          event.messageID
        );
      }
    } catch (error) {
      console.error(error);
      return api.sendMessage(`error`, event.threadID, event.messageID);
    }

    try {
      if (args[0] === "v") {
        const videoPath = __dirname + `/cache/abdul.mp4`;
        let videoData = (await axios.get(event.attachments[0].playableUrl, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(videoPath, Buffer.from(videoData, "binary"));

        const shortUrl = await shortenURL(event.attachments[0].playableUrl); 
        return api.sendMessage(
          {
            body: `Your Request ✅ 🔗\nDownload Url: ${shortUrl}`,
            attachment: fs.createReadStream(videoPath),
          },
          event.threadID,
          () => fs.unlinkSync(videoPath),
          event.messageID
        );
      }
    } catch (error) {
      console.error(error);
      return api.sendMessage(`error`, event.threadID, event.messageID);
    }
  },
};
