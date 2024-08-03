const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "namepicker",
    version: "1.0",
    author: "Vex_kshitiz",
    shortDescription: "Pick a random name from the provided list or the group chat",
    category: "Utility",
    guide: {
      en: "{p}namepicker {name1} {name2} {name3}...",
    },
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    if (args.length === 0) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = threadInfo.participantIDs;
      const randomIndex = Math.floor(Math.random() * participantIDs.length);
      const randomUserID = participantIDs[randomIndex];
      const userInfo = await api.getUserInfo([randomUserID]);
      const user = userInfo[randomUserID];
      const avatarUrl = await usersData.getAvatarUrl(randomUserID);
      const imageResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      const image = Buffer.from(imageResponse.data, "binary");
      const outputFile = path.join(__dirname, "cache", `pp.png`);

      const fileStream = fs.createWriteStream(outputFile);
      fileStream.write(image);
      fileStream.end();

      fileStream.on("finish", () => {
        message.reply({
          body: `Winner: ${user.name}`,
          attachment: fs.createReadStream(outputFile),
        });
      });
    } else if (args.length === 1) {
      message.reply("Please provide more than one name in the list.");
    } else {
      const randomIndex = Math.floor(Math.random() * args.length);
      const winner = args[randomIndex];
      message.reply(`Winner: ${winner}`);
    }
  },
};
