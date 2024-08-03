const fs = require("fs");
const path = require("path");
const axios = require("axios");


const ratios = {
  "1:1": { width: 1024, height: 1024 },
  "9:7": { width: 1152, height: 896 },
  "7:9": { width: 896, height: 1152 },
  "19:13": { width: 1216, height: 832 },
  "13:19": { width: 832, height: 1216 },
  "7:4": { width: 1344, height: 768 },
  "4:7": { width: 768, height: 1344 },
  "12:5": { width: 1536, height: 640 },
  "5:12": { width: 640, height: 1536 },
  "9:16": { width: 640, height: 1136 }
};

module.exports = {
  config: {
    name: "anigen",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate an image based on a prompt.",
    longDescription: "Generates an image based on a prompt and optional ratio.",
    category: "fun",
    guide: "{p}anigen <prompt> -<ratio>"
  },
  onStart: async function ({ message, args, api, event }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const joinedArgs = args.join(" ");
      const [prompt, ratio] = joinedArgs.split(/[-—]/).map(arg => arg.trim());

     
      const validRatio = ratios.hasOwnProperty(ratio) ? ratio : "1:1";

   
      let apiUrl = "https://imagegeneration-kshitiz-6846.onrender.com/anigen?prompt=" + encodeURIComponent(prompt);
      if (validRatio !== "1:1") {
        apiUrl += "&ratio=" + encodeURIComponent(validRatio);
      }

     
      const response = await axios.get(apiUrl, { responseType: "stream" });

 
      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      
      const imagePath = path.join(cacheFolderPath, `anigen.png`);

      
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
      
        const stream = fs.createReadStream(imagePath);
        message.reply({
          body: "",
          attachment: stream
        });
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | Failed to generate image.");
    }
  }
};
