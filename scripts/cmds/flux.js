const axios = require('axios');
const { GoatWrapper } = require('fca-liane-utils');

module.exports = {
  config: {
    name: "flux",
    aliases: ["ff"],
    version: "1.1",
    author: "Samir Œ || Modified By Priyanshi Kaur",
    countDown: 5,
    role: 2,
    shortDescription: "Image generator from Fluxfl API",
    longDescription: "",
    category: "ai",
    guide: {
      en: "{pn} <prompt> --ar 1:1 --model 2"
    }
  },

  onStart: async function ({ message, args }) {
    const waitingMessages = [
      "🎨 Creating your masterpiece...",
      "🖌️ Painting with pixels...",
      "🌈 Summoning colors from the digital realm...",
      "🔮 Consulting the AI oracle...",
      "🚀 Launching your imagination into cyberspace..."
    ];

    const randomWaitingMessage = waitingMessages[Math.floor(Math.random() * waitingMessages.length)];
    await message.reply(randomWaitingMessage);

    let prompt = args.join(" ");
    let aspectRatio = "1:1";
    let model = "2";

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--ar" && args[i + 1]) {
        aspectRatio = args[i + 1];
      }
      if (args[i] === "--model" && args[i + 1]) {
        model = args[i + 1];
      }
    }

    try {
      const apiUrl = `https://www.samirxpikachu.run.place/fluxfl?prompt=${encodeURIComponent(prompt)}&ratio=${aspectRatio}&model=${model}`;
      const imageStream = await global.utils.getStreamFromURL(apiUrl);

      if (!imageStream) {
        return message.reply("❌ Oops! The image couldn't be generated. For support, Contact mfacebook.com/PriyanshiKaurJi ❤️");
      }
      
      return message.reply({
        body: '✨ Ta-da! Here\'s your Requested Picture! 🖼️',
        attachment: imageStream
      });
    } catch (error) {
      console.error(error);
      return message.reply("💔 Oh no! Something went wrong. For help, please join https://t.me/Architectdevs 🆘");
    }
  }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
