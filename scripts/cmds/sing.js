
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "sing3",
    version: "1.1",
    role: 0,
    author: "Shikaki | Base code: AceGun",
    cooldowns: 5,
    description: "Download music from Youtube",
    category: "media",
    usages: "{pn} music name",
  },

  onStart: ({}) => {},
  onChat: async ({ api, event }) => { 
    const alias = ['sing','music','song'];
    if (alias.some(a => event.body.toLowerCase().startsWith(a))) {
        const input = event.body;
        const data = input.split(" ");
    
        if (data.length < 2) {
          return api.sendMessage("Please specify a music name!", event.threadID);
        }
    
        data.shift();
        const musicName = data.join(" ");

        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
          console.log("1. Downloading...");
          const response = await axios.get(`https://shikakiapis-theone2277s-projects.vercel.app/vmam/apis?yt=${musicName}&type=s`, { responseType: 'arraybuffer' });
          console.log("2. Downloaded and sending...");

          const fileName = `${new Date().getTime()}.mp3`;
          const tempDir = os.tmpdir();
          const filePath = path.join(tempDir, fileName);

          fs.writeFileSync(filePath, response.data);

          if (fs.statSync(filePath).size > 26214400) {
            fs.unlinkSync(filePath);
            return api.sendMessage("❌ | The file could not be sent because it is larger than 25MB.", event.threadID);
          }

          const message = {
            body: `💁🏻‍♂ • Here's your music!\n\n♥ • Title: ${musicName}`,
            attachment: fs.createReadStream(filePath),
          };

          api.sendMessage(message, event.threadID, () => {
            fs.unlinkSync(filePath);
            console.log("3. Sent successfully!");
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);
        } catch (error) {
          console.error("[ERROR]", error);
          api.setMessageReaction("❌", event.messageID, () => { }, true);
          return;
        }
    }
  },
};

