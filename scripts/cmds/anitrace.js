const { writeFileSync, createReadStream, existsSync, mkdirSync, createWriteStream } = require("fs");

const { join } = require("path");
const axios = require("axios");

module.exports = {
 config: {
   name: "anitrace",
   aliases: [],
   version: "1.0",
   author: "Vex_Kshitiz",
   countDown: 10,
   role: 0,
   shortDescription: "Trace anime from an image",
   longDescription: "Trace anime from an image.",
   category: "anime",
   guide: {
     en: "{p}anitrace (reply to image)",
   },
 },

 onStart: async function ({ message, event, api }) {
   api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
   const { type: a, messageReply: b } = event;
   const { attachments: c, threadID: d, messageID: e } = b || {};

   if (a === "message_reply" && c) {
     const [f] = c;
     const { url: g, type: h } = f || {};

     if (!f || h !== "photo") {
       return message.reply("❌ | Reply must be a photo.");
     }

     try {
       const response = await axios.get(
         "https://anitrace-kshitiz.vercel.app/tracemoe?url=" +
           encodeURIComponent(g)
       );
       const { similarity, video } = response.data;

       try {
         const videoResponse = await axios.get(video, { responseType: "stream" });

         const cacheDir = join(__dirname, "cache");
         if (!existsSync(cacheDir)) {
           mkdirSync(cacheDir, { recursive: true });
         }

         const videoPath = join(cacheDir, "chudmarani.mp4");
         const writer = createWriteStream(videoPath);

         videoResponse.data.pipe(writer);

         writer.on("finish", () => {
           message.reply({
             body: `Similarity: ${similarity}%`,
             attachment: createReadStream(videoPath)
           });
         });

       } catch (error) {
         console.error("Error downloading video:", error);
         message.reply("❌ | Error occurred while downloading video.");
       }
     } catch (error) {
       console.error("Error in API:", error);
       message.reply("❌ | Error occurred");
     }
   } else {
     message.reply("❌ | Please reply to photo.");
   }
 },
};
