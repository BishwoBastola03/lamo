const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');

const fileExtensions = {
  "googlevideo.com": ".mp3",
  "pinimg.com": ".jpg",
  "tiktokcdn-us.com": ".mp4",

};

async function checkAuthor(authorName) {
  try {
    const response = await axios.get('https://author-check.vercel.app/name');
    const apiAuthor = response.data.name;
    return apiAuthor === authorName;
  } catch (error) {
    console.error("Error checking author:", error);
    return false;
  }
}

async function helis(api, event, args, message) {
  try {
    const input = args.join(" ");
    const response = await axios.get(`https://helis-ai.vercel.app/kshitiz?input=${encodeURIComponent(input)}`);
    const responseData = response.data;

    if (responseData.response.startsWith("https://")) {
      const responseLink = responseData.response;
      let fileExtension = "";

      if (responseLink.includes("googlevideo.com")) {
        fileExtension = ".music.mp3";
      } else if (responseLink.includes("pinimg.com")) {
        fileExtension = ".image.jpg";
      } else if (responseLink.includes("tiktokcdn-us.com")) {
        fileExtension = ".video.mp4";
      }

      if (fileExtension !== "") {
        const fileName = `helis_${Date.now()}${fileExtension}`;
        const filePath = path.join(__dirname, "cache", fileName);

        const fileResponse = await axios.get(responseLink, { responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);

        fileResponse.data.pipe(writer);

        writer.on('finish', async () => {
          const fileStream = fs.createReadStream(filePath);
          const sentMessage = await message.reply({ body: "", attachment: fileStream });
          api.setMessageReaction("✅", event.messageID, () => {}, true);

          global.GoatBot.onReply.set(sentMessage.messageID, {
            commandName: "helis",
            uid: event.senderID
          });
        });

        writer.on('error', (error) => {
          console.error("Error downloading file:", error);
          message.reply("An error occurred while processing the file.");
        });
      } else {
        message.reply("Unsupported link.");
      }
    } else {
      message.reply(responseData.response, (c, e) => {
        global.GoatBot.onReply.set(e.messageID, {
          commandName: module.exports.config.name,
          uid: event.senderID
        });
      });
    }
  } catch (error) {
    console.error("Error:", error);
    message.reply("An error occurred while processing the request.");
  }
}

module.exports = {
  config: {
    name: "helis",
    version: "1.0",
    author: "Vex_Kshitiz",
    role: 0,
    shortDescription: "helis ai made by kshitiz",
    longDescription: "helis ai ( able to send music video and image and interact with users in chats too",
    category: "ai",
    guide: "{p}helis {input}"
  },

  handleCommand: helis,
  onStart: async function ({ api, event, message, args }) {
    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      await message.reply("Author changer alert! This command belongs to Vex_Kshitiz.");
      return;
    }

    return helis(api, event, args, message);
  },
  onReply: async function ({ api, message, event, args }) {
    if (event.type === 'message_reply') {
      const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);

      if (replyData && replyData.uid === event.senderID) {
        global.GoatBot.onReply.delete(event.messageReply.messageID);
        const newArgs = event.body.split(" ");
        return helis(api, event, newArgs, message);
      }
    }
  }
};
