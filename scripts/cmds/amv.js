const axios = require("axios");
const fs = require("fs");
const path = require("path");


const channelLinks = [ 

  "https://www.youtube.com/@AnimeMVSensei",

];

module.exports = {
  config: {
    name: "amv",
    aliases: [], 
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "",
    longDescription: "Get a random animes amv.",
    category: "utility",
    guide: "{p}amv",
  },

  onStart: async function ({ api, event, args, message }) {
    api.setMessageReaction("✨", event.messageID, (err) => {}, true);

    try {

      const randomChannelLink = channelLinks[Math.floor(Math.random() * channelLinks.length)];


      const apiResponse = await axios.get(`https://god-kshitiz.vercel.app/channel?link=${encodeURIComponent(randomChannelLink)}`);


      const channelVideoUrl = apiResponse.data.urls[0];


      const videoResponse = await axios.get(channelVideoUrl, { responseType: "stream" });


      const tempVideoPath = path.join(__dirname, "cache", `amv.mp4`);

      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);

      writer.on("finish", async () => {

        const stream = fs.createReadStream(tempVideoPath);


        message.reply({
          body: "",
          attachment: stream,
        });

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      });
    } catch (error) {
      console.error(error);
      message.reply("Sorry, an error occurred.");
    }
  }
};
