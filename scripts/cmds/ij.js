const fs = require('fs-extra');
const path = require("path");
const axios = require("axios");
const tinyurl = require('tinyurl');
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const { getStreamFromURL, shortenURL, randomString } = global.utils;
const ffmpeg = require('ffmpeg-static');
const { createReadStream } = require("fs");
const { join } = require("path");
const cheerio = require("cheerio");
const os = require('os');
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
const commands = {};





commands.animex = {
  config: {
    name: "animex",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate anime image based on prompt.",
    longDescription: "Generates an anime image based on the provided prompt.",
    category: "fun",
    guide: "{p}animex <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
     api.setMessageReaction("✨", event.messageID, (err) => {}, true);  
    try {
      const prompt = args.join(" ");
      const animexApiUrl = `https://imagegeneration-kshitiz-h3vi.onrender.com/animex?prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(animexApiUrl, {
        responseType: "arraybuffer"
      });

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `anime_image.png`);
      fs.writeFileSync(imagePath, response.data);

      message.reply({
        body: "",
        attachment: fs.createReadStream(imagePath) 
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("provide a prompt to gen image.");
    }
  }
};



commands.animexx = {
  config: {
    name: "animexx",
    aliases: ["animexx"],
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 20,
    role: 0,
    longDescription: {
      vi: '',
      en: "Animexx"
    },
    category: "ai",
    guide: {
      vi: '',
      en: "{pn} <prompt> - <ratio>"
    }
  },

  onStart: async function ({ api, commandName, event, args }) {
    try {
      api.setMessageReaction("✅", event.messageID, (a) => {}, true);
      let prompt = args.join(' ');
      let ratio = '1:1';

      if (args.length > 0 && args.includes('-')) {
        const parts = args.join(' ').split('-').map(part => part.trim());
        if (parts.length === 2) {
          prompt = parts[0];
          ratio = parts[1];
        }
      }

      const response = await axios.get(`https://anime-xx-oulv.onrender.com/kshitiz?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`);
      const imageUrl = response.data.imageUrls;

      const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imgPath = path.join(__dirname, 'cache', 'anime_image.jpg');
      await fs.outputFile(imgPath, imgResponse.data);
      const imgData = fs.createReadStream(imgPath);

      await api.sendMessage({ body: '', attachment: imgData }, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("Error: Please contact the administrator.", event.threadID, event.messageID);
    }
  }
};


commands.anigen = {
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


      let apiUrl = "https://imagegeneration-kshitiz-h3vi.onrender.com/anigen?prompt=" + encodeURIComponent(prompt);
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

commands.animagine = {
  config: {
    name: "animagine",
    aliases: [],
    version: "1.0",
    author: "Kshitiz",
    countDown: 20,
    role: 0,
    shortDescription: "Generate an anime style image.",
    longDescription: "Generate an anime style image",
    category: "ai",
    guide: {
      en: "{p}imagine [prompt] | [model]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      let imageUrl = null;
      let prompt = '';

      if (event.type === "message_reply") {
        const attachment = event.messageReply.attachments[0];
        if (!attachment || !["photo", "sticker"].includes(attachment.type)) {
          return message.reply("ayo reply to an image");
        }
        imageUrl = attachment.url;
      } else if (args.length > 0 && args[0].startsWith("http")) {
        imageUrl = args[0];
      } else if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("Please reply to an image or provide vaild prompt.");
      }

      if (imageUrl) {
        const shortUrl = await tinyurl.shorten(imageUrl);
        const promptResponse = await axios.get(`https://www.api.vyturex.com/describe?url=${encodeURIComponent(shortUrl)}`);
        prompt = promptResponse.data;
      }

      const promptApiUrl = `https://text2image-wine.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}&model=1`;
      const response = await axios.get(promptApiUrl);
      const { task_id } = response.data;

      const progressApiUrl = `https://progress-black.vercel.app/progress?imageid=${task_id}`;

      let imgDownloadLink = null;

      while (!imgDownloadLink) {
        const progressResponse = await axios.get(progressApiUrl);
        const { status, imgs } = progressResponse.data.data;

        if (status === 2 && imgs && imgs.length > 0) {
          imgDownloadLink = imgs[0];
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${task_id}.png`);
      const writer = fs.createWriteStream(imagePath);
      const imageResponse = await axios({
        url: imgDownloadLink,
        method: 'GET',
        responseType: 'stream'
      });

      imageResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stream = fs.createReadStream(imagePath);
      await message.reply({
        body: "",
        attachment: stream
      });

    } catch (error) {
      console.error("Error:", error.message);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

commands.prodia = {
  config: {
    name: "prodia",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "prodia",
    longDescription: "Generate images using Prodia",
    category: "utility",
    guide: {
      en: "{p} prodia [prompt] | [model_id]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://prodia-kshitiz-rxop.onrender.com/gen";
      const apiKey = "d866dda8-c353-4d37-9789-aeb5ee8347a2"; // add apiKey from prodia web 
      let prompt = '';
      let model_id = null;

      if (args.length > 0) {
        const argParts = args.join(" ").split("|");
        prompt = argParts[0].trim();
        if (argParts.length > 1) {
          model_id = argParts[1].trim();
        }
      } 

      if (!prompt || !model_id) {
        return message.reply("provide both a prompt and a model. ex:- prodia cat | 56 "); // the last model is 56 ok niggas

      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model: model_id,
          key: apiKey
        }
      });

      if (apiResponse.data.transformedImageUrl) {
        const imageUrl = apiResponse.data.transformedImageUrl;
        const imagePath = path.join(__dirname, "cache", `prodia.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("image URL not found.");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred.");
    }
  }
};
commands.replicate = {
  config: {
    name: "replicate",
    aliases: [],
    author: "Vex-Kshitiz",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "image gen.",
    longDescription: "gen image based on prompt.",
    category: "fun",
    guide: "{p}replicate <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
    api.setMessageReaction("✨", event.messageID, (err) => {}, true);
    try {
      const prompt = args.join(" ");
      const replicateApiUrl = `https://imagegeneration-kshitiz-h3vi.onrender.com/replicate?prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(replicateApiUrl);


      const imageUrl = response.data.url[0][0];

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `image.png`);
      const imageStream = fs.createWriteStream(imagePath);

      const imageResponse = await axios.get(imageUrl, {
        responseType: "stream"
      });

      imageResponse.data.pipe(imageStream);

      imageStream.on("finish", () => {
        message.reply({
          body: "",
          attachment: fs.createReadStream(imagePath)
        });
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred.");
    }
  }
};
commands.imagine = {
  config: {
    name: "imagine",
    aliases: ["imagine"],
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 50,
    role: 0,
    longDescription: {
      vi: '',
      en: "Imagine"
    },
    category: "ai",
    guide: {
      vi: '',
      en: "{pn} <prompt> - <ratio>"
    }
  },

  onStart: async function ({ api, commandName, event, args }) {
    try {

      let prompt = args.join(' ');
      let ratio = '1:1';

      if (args.length > 0 && args.includes('-')) {
        const parts = args.join(' ').split('-').map(part => part.trim());
        if (parts.length === 2) {
          prompt = parts[0];
          ratio = parts[1];
        }
      }

      const response = await axios.get(`https://imagine-kshitiz-dxb8.onrender.com/kshitiz?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`);
      const imageUrls = response.data.imageUrls;

      const imgData = [];
      const numberOfImages = 4;

      for (let i = 0; i < Math.min(numberOfImages, imageUrls.length); i++) {
        const imageUrl = imageUrls[i];
        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgPath = path.join(__dirname, 'cache', `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push(fs.createReadStream(imgPath));
      }

      await api.sendMessage({ body: '', attachment: imgData }, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("error contact kshitiz", event.threadID, event.messageID);
    }
  }
};



commands.genx = {
  config: {
    name: "genx",
    aliases: [],
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 50,
    role: 0,
    longDescription: {
      vi: '',
      en: "Generate images"
    },
    category: "ai",
    guide: {
      vi: '',
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, commandName, event, args }) {
    try {
      api.setMessageReaction("✅", event.messageID, (a) => {}, true);
      const prompt = args.join(' ');

      const response = await axios.get(`https://dall-e-tau-steel.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}`);
      const imageUrl = response.data.response;

      const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imgPath = path.join(__dirname, 'cache', 'dalle_image.jpg');
      await fs.outputFile(imgPath, imgResponse.data);
      const imgData = fs.createReadStream(imgPath);

      await api.sendMessage({ body: '', attachment: imgData }, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("Error generating image. Please try again later.", event.threadID, event.messageID);
    }
  }
};
commands.xl = {
  config: {
    name: "xl",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "animagine xl 3.1.",
    longDescription: "Generates an image based on animagine xl 3.1.",
    category: "fun",
    guide: "!xl <prompt> [-<ratio>] [-<style>]"
  },
  onStart: async function ({ message, args, api, event }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const joinedArgs = args.join(" ");
      const [prompt, ratio, style] = joinedArgs.split(/[-—]/).map(arg => arg.trim());

      if (!prompt) {
        message.reply("❌ | Please provide a prompt.");
        return;
      }

      const finalRatio = ratio && aspectRatioMap.hasOwnProperty(ratio) ? ratio : "1:1";
      const finalStyle = style && !isNaN(style) && style >= 0 && style <= 10 ? parseInt(style) : 0;

      const apiUrl = `https://xl31-xt9r.onrender.com/kshitiz?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(finalRatio)}&style=${encodeURIComponent(finalStyle)}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      const imageData = Buffer.from(response.data, "binary");

      const imagePath = path.join(__dirname, "/cache", `xl.jpg`);

      fs.writeFileSync(imagePath, imageData);

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: "",
        attachment: stream
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | Failed to generate image.");
    }
  }
};

commands.meina = {
  config: {
    name: "meina",
    aliases: ["mh"],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "meina hent*i",
    longDescription: "create NSFW illustrations ",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 8; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `meina.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

commands.darksushi = {
  config: {
    name: "darksushi",
    aliases: ["dks"],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "darksushi",
    longDescription: "Dark sushi mix",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 9; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `ds.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};


commands.creative = {
  config: {
    name: "creative",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "creative engine",
    longDescription: "creative engine",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 11; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `creative.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};


commands.creative2 = {
  config: {
    name: "creative2",
    aliases: ["creativev2"],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "creative engine",
    longDescription: "creative engine v2",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 12; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `creativev2.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};
commands.reality = {
  config: {
    name: "reality",
    aliases: ["ar"],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "absolute reality",
    longDescription: "absolute reality",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 13; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `reality.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};
  commands.anime = {
        config: {
          name: "anime",
          aliases: ["anime"],
          version: "1.0",
          author: "vex_Kshitiz",
          countDown: 5,
          role: 0,
          shortDescription: "animev1",
          longDescription: "animev1",
          category: "image",
          guide: {
            en: "{p}meina [prompt]"
          }
        },
        onStart: async function ({ message, event, args, api }) {
          api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
          try {
            const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
            let prompt = '';
            const model_id = 15; 

            if (args.length > 0) {
              prompt = args.join(" ").trim();
            } else {
              return message.reply("❌ | Please provide a prompt.");
            }

            const apiResponse = await axios.get(baseUrl, {
              params: {
                prompt: prompt,
                model_id: model_id
              }
            });

            if (apiResponse.data.imageUrl) {
              const imageUrl = apiResponse.data.imageUrl;
              const imagePath = path.join(__dirname, "cache", `animev1.png`);
              const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
              const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
              imageStream.on("finish", () => {
                const stream = fs.createReadStream(imagePath);
                message.reply({
                  body: "",
                  attachment: stream
                });
              });
            } else {
              throw new Error("Image URL not found in response");
            }
          } catch (error) {
            console.error("Error:", error);
            message.reply("❌ | An error occurred. Please try again later.");
          }
        }
      };

commands.lexica = {
  config: {
    name: "lexica",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "lexica",
    longDescription: "lexica",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 16; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `lexica.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};


commands.cm = {
  config: {
    name: "cm",
    aliases: ["calicomix"],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "calicomix",
    longDescription: "calicomix",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 17; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `cm.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};
commands.cetus = {
  config: {
    name: "cetus",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "cetus mix",
    longDescription: "cetus mix",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 25; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `cetus.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};


commands.ani = {
  config: {
    name: "ani",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "anime v1",
    longDescription: "animev1",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 30; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `ani.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

commands.ani2 = {
  config: {
    name: "ani2",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "anime v2",
    longDescription: "animev2",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 32; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `ani2.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

commands.ani3 = {
  config: {
    name: "ani3",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "anime v3",
    longDescription: "animev3",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 40; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `ani3.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

commands.de = {
  config: {
    name: "de",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "Dalle- E",
    longDescription: "Dall - E",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 33; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `de.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};


commands.logo = {
  config: {
    name: "logo",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "logo gen",
    longDescription: "logo gen",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 36; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `logo.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

commands.sticker = {
  config: {
    name: "sticker",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "stickergen",
    longDescription: "sticker gen",
    category: "image",
    guide: {
      en: "{p}meina [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://kshitiz-t2i-fjfq.onrender.com/sdxl";
      let prompt = '';
      const model_id = 39; 

      if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please provide a prompt.");
      }

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model_id: model_id
        }
      });

      if (apiResponse.data.imageUrl) {
        const imageUrl = apiResponse.data.imageUrl;
        const imagePath = path.join(__dirname, "cache", `sticker.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        imageStream.on("finish", () => {
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        });
      } else {
        throw new Error("Image URL not found in response");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};

module.exports = {
  config: {
    name: "imagejourney",
    aliases: ["ij"],
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "all image generation cmd combined.",
    longDescription: "all image generation cmd combined.",
    category: "general",
    guide: {
      en: "{p}ij <cmdName> prompt"
    }
  },
  onStart: async function ({ message, args, api, event }) {
    if (args.length === 0) {
      return message.reply("Please provide a command name.");
    }

    const cmdName = args[0];
    const cmdArgs = args.slice(1);

    if (cmdName === "list") {
      const availableCommands = Object.keys(commands).map(cmd => commands[cmd].config.name).join(", ");
      return message.reply(`Available commands: ${availableCommands}`);
    }

    const command = commands[cmdName];
    if (!command) {
      return message.reply(`Command "${cmdName}" not found.`);
    }

    command.onStart({ message, args: cmdArgs, api, event });
  }
};
