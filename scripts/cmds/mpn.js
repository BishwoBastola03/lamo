const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: 'mpn',
    aliases: ['fun3'],
    version: '1.0',
    author: 'Vex_Kshitiz',
    countDown: 5,
    role: 0,
    shortDescription: '',
    longDescription: 'get mood posting videos (Nepal)',
    category: 'fun',
    guide: {
      en: '{p}{n}',
    }
  },

  onStart: async function ({ api, event }) {
    const d = event.threadID;

    try {
      api.setMessageReaction("🕐", event.messageID, (a) => {}, true);

      const a = "https://fun3-mpn.vercel.app/kshitiz";
      const b = await axios.get(a);

      if (b.data.url) {
        const c = b.data.url;
        console.log(`Facebook Video URL: ${c}`);

        const e = `https://kshitiz-fb.vercel.app/fb?url=${encodeURIComponent(c)}`;
        const f = await axios.get(e);

        if (f.data.download && f.data.download.length > 0) {
          const g = f.data.download;
          const h = g.find((i) => i.quality === '720p (HD)');

          if (h && h.url) {
            const j = h.url;
            console.log(`720p Video URL: ${j}`);

            const k = __dirname + `/cache/mpn.mp4`;
            await this.downloadVideo(j, k);

            if (fs.existsSync(k)) {
              await api.sendMessage({
                body: "",
                attachment: fs.createReadStream(k),
              }, d, event.messageID);

              fs.unlinkSync(k);
            } else {
              api.sendMessage("Error downloading the video.", d);
            }
          } else {
            api.sendMessage("video not found.", d);
          }
        } else {
          api.sendMessage("Error fetching url", d);
        }
      } else {
        api.sendMessage("Error fetching post url", d);
      }
    } catch (a) {
      console.error(a);
      api.sendMessage("An error occurred.", d);
    }
  },

  downloadVideo: async function (a, b) {
    try {
      const c = await axios({
        method: "GET",
        url: a,
        responseType: "arraybuffer"
      });

      fs.writeFileSync(b, Buffer.from(c.data, "utf-8"));
    } catch (a) {
      console.error(a);
    }
  },
};
