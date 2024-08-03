const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "footballedit",
    aliases: ["fbledit"],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 30,
    role: 0,
    shortDescription: "",
    longDescription: "Get random football edits video",
    category: "fun",
    guide: "{p}fbledit",
  },

  onStart: async function ({ api, event, args, message }) {
    api.setMessageReaction("✨", event.messageID, (err) => {}, true);

    try {
      const response = await axios.get("https://footballs-edit-itbq.onrender.com/kshitiz");
      const postData = response.data.posts;
      const randomIndex = Math.floor(Math.random() * postData.length);
      const randomPost = postData[randomIndex];

      const videoUrls = randomPost.map(url => url.replace(/\\/g, "/"));

      const selectedUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];

      const videoResponse = await axios.get(selectedUrl, { responseType: "stream" });

      const tempVideoPath = path.join(__dirname, "cache", `lauda.mp4`);
      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);

      writer.on("finish", async () => {
        const stream = fs.createReadStream(tempVideoPath);

        await message.reply({
          body: ``,
          attachment: stream,
        });
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        fs.unlink(tempVideoPath, (err) => {
          if (err) console.error(err);
          console.log(`Deleted ${tempVideoPath}`);
        });
      });
    } catch (error) {
      console.error(error);
      message.reply("Sorry, an error occurred.");
    }
  }
};
