const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "monitor",
    aliases: [],
    version: "1.0",
    author: "Vex_kshitiz",
    role: 0,
    shortDescription: { en: "Displays the bot's uptime and ping." },
    longDescription: { en: "Find out how long the bot has been tirelessly serving you and its current ping." },
    category: "owner",
    guide: { en: "Use {p}monitor to reveal the bot's uptime and ping." }
  },
  onStart: async function ({ api, event, args }) {
    try {
      const t = Date.now(); 

      const s = ["zoro", "madara", "obito", "luffy"];

      const r = Math.floor(Math.random() * s.length);
      const q = s[r];

      const u = `https://pin-two.vercel.app/pin?search=${encodeURIComponent(q)}`;

      const a = await axios.get(u);
      const l = a.data.result;

      const i = Math.floor(Math.random() * l.length);
      const p = l[i];

      const b = await axios.get(p, { responseType: 'arraybuffer' });
      const f = path.join(__dirname, 'cache', `monitor_image.jpg`);
      await fs.outputFile(f, b.data);

      const e = process.uptime();
      const k = Math.floor(e % 60);
      const h = Math.floor((e / 60) % 60);
      const g = Math.floor((e / (60 * 60)) % 24);
      const d = Math.floor(e / (60 * 60 * 24));

      let c = `${d} days, ${g} hours, ${h} minutes, and ${k} seconds`;
      if (d === 0) {
        c = `${g} hours, ${h} minutes, and ${k} seconds`;
        if (g === 0) {
          c = `${h} minutes, and ${k} seconds`;
          if (h === 0) {
            c = `${k} seconds`;
          }
        }
      }

      const m = Date.now() - t;

      const message = `Greetings! Your bot\nhas been running for:\n${c}\n\nCurrent Ping: ${m}`;
      const imageStream = fs.createReadStream(f);

      await api.sendMessage({
        body: message,
        attachment: imageStream
      }, event.threadID, event.messageID);

      await fs.unlink(f);
    } catch (error) {
      console.error(error);
      return api.sendMessage(`An error occurred.`, event.threadID, event.messageID);
    }
  }
};
