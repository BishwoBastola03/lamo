const fs = require("fs-extra");
const axios = require("axios");
const { createReadStream } = require("fs");
const { join } = require("path");

module.exports = {
  config: {
    name: "album",
    aliases: ["gallery"],
    version: "2.0",
    author: "Vex_kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "album or gallery to save attachments of users",
    longDescription: "save your videos audios or images with specific title for each attachments.",
    category: "utility",
    guide: {
      en: "To store an attachment: {p}album add {title}\nTo view specific albums content: {p}album audio / {p}album video / {p}album image\nTo view saved attachments: {p}album show {title} ",
    },
  },

  onStart: async function ({ api, event, args }) {
    const senderID = event.senderID;
    const command = args[0];
    const title = args.slice(1).join(" ");

    try {
      const albumPath = `./albums/${senderID}`;
      const imagePath = `${albumPath}/images`;
      const videoPath = `${albumPath}/videos`;
      const audioPath = `${albumPath}/audios`;

      await fs.ensureDir(albumPath);
      await fs.ensureDir(imagePath);
      await fs.ensureDir(videoPath);
      await fs.ensureDir(audioPath);

      if (command === "add" && title && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const attachment = event.messageReply.attachments[0];
        const attachmentType = attachment.type.split("/")[0]; 
        const attachmentURL = attachment.url;
        let filePath = '';

        if (attachmentType === 'photo') {
          filePath = join(imagePath, `${title}.png`);
        } else if (attachmentType === 'video') {
          filePath = join(videoPath, `${title}.mp4`);
        } else if (attachmentType === 'audio') {
          filePath = join(audioPath, `${title}.mp3`);
        } else {
          api.sendMessage(`Unsupported file type.`, event.threadID, event.messageID);
          return;
        }

        if (fs.existsSync(filePath)) {
          api.sendMessage(`A file with the title "${title}"\nalready exists.\nPlease choose another title.`, event.threadID, event.messageID);
          return;
        }

        const response = await axios.get(attachmentURL, { responseType: "stream" });
        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);

        return new Promise((resolve, reject) => {
          fileStream.on("finish", () => {
            api.sendMessage(`Attachment saved successfully\nwith title "${title}".`, event.threadID, event.messageID);
            resolve();
          });
          fileStream.on("error", (err) => {
            reject(err);
          });
        });
      } else if (command === "audio" || command === "video" || command === "image") {
        const files = await fs.readdir(join(albumPath, command + "s"));

        if (files.length === 0) {
          api.sendMessage(`This album is currently empty.`, event.threadID, event.messageID);
          return;
        }

        let message = "";
        files.forEach((file, index) => {
          message += `${index + 1}. ${file.replace(/\.[^/.]+$/, "")}\n`;
        });

        api.sendMessage(message, event.threadID, (err, info) => {
          if (err) {
            console.error(err);
            return;
          }
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "album",
            senderID: senderID,
            messageType: command,
            files: files,
          });
        });
      } else if (command === "show" || command === "view") {
        let found = false;
        for (let type of ["audio", "video", "image"]) {
          const filePath = join(albumPath, type + "s", `${title}.${type === "image" ? "png" : type === "video" ? "mp4" : "mp3"}`);
          if (await fs.pathExists(filePath)) {
            api.sendMessage({
              attachment: createReadStream(filePath)
            }, event.threadID, event.messageID);
            found = true;
            break; 
          }
        }
        if (!found) {
          api.sendMessage(`No media found with the title "${title}".`, event.threadID, event.messageID);
          return;
        }
      } else if (command === "del") {
        let deleted = false;
        for (let type of ["audio", "video", "image"]) {
          const filePath = join(albumPath, type + "s", `${title}.${type === "image" ? "png" : type === "video" ? "mp4" : "mp3"}`);
          if (await fs.pathExists(filePath)) {
            await fs.unlink(filePath);
            api.sendMessage(`"${title}" deleted successfully.`, event.threadID, event.messageID);
            deleted = true;
            break; 
          }
        }
        if (!deleted) {
          api.sendMessage(`No media found with the title "${title}".`, event.threadID, event.messageID);
          return;
        }
      } else if (command === "all") {
        let message = "";
        for (let type of ["audio", "video", "image"]) {
          const files = await fs.readdir(join(albumPath, type + "s"));
          if (files.length > 0) {
            message += `[${type}]\n`;
            files.forEach((file, index) => {
              message += `${index + 1}. ${file.replace(/\.[^/.]+$/, "")}\n`;
            });
          }
        }
        if (message === "") {
          message = "All albums are currently empty.";
        }
        api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage("Invalid command. Please use the correct syntax.", event.threadID, event.messageID);
      }
    } catch (err) {
      console.error(err);
      api.sendMessage("An error occurred.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { commandName, senderID, messageType, files } = Reply;

    if (commandName !== "album" || senderID !== event.senderID || !messageType || !files) {
      return;
    }

    const fileIndex = parseInt(args[0], 10);

    if (isNaN(fileIndex) || fileIndex <= 0 || fileIndex > files.length) {
      api.sendMessage({ body: "Invalid input.\nPlease provide a valid number." }, event.threadID, event.messageID);
      return;
    }

    const selectedFile = files[fileIndex - 1];
    const filePath = join("./albums", senderID, messageType + "s", selectedFile);

    try {
      const fileStream = fs.createReadStream(filePath);
      api.sendMessage({ body: `Here is your ${messageType}:`, attachment: fileStream }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred while processing the file.\nPlease try again later." }, event.threadID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },
};
