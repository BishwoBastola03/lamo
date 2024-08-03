const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'anigif',
    aliases: ['anigif'],
    version: '1.0',
    author: 'Vex_Kshitiz',
    role: 0,
    category: 'anime',
    shortDescription: {
      en: 'Sends a random anime gif based on category.'
    },
    longDescription: {
      en: 'Sends a random anime gif based on category. Available categories are: angry, bite, bored, bread, chocolate, cookie, cuddle, dance, drunk, happy, hug, kick, kill, kiss, laugh, lick, lonely, pat, poke, pregnant, punch, run, slap, sleep, spank, spit, steal, tickle, nomm'
    },
    guide: {
      en: '{pn} anigif [category]'
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      let category = args[0];
      const categories = ['angry', 'bite', 'bored', 'bread', 'chocolate', 'cookie', 'cuddle', 'dance', 'drunk', 'happy', 'hug', 'kick', 'kill', 'kiss', 'laugh', 'lick', 'lonely', 'pat', 'poke', 'pregnant', 'punch', 'run', 'slap', 'sleep', 'spank', 'spit', 'steal', 'tickle', 'nomm'];

      
      if (!category || !categories.includes(category.toLowerCase())) {
        api.sendMessage(`Available categories are: ${categories.join(', ')}`, event.threadID, event.messageID);
        return;
      }

      const response = await axios.get(`https://ani-giff.vercel.app/kshitiz?category=${category}`);

      if (response.status !== 200 || !response.data || !response.data.url) {
        throw new Error('Invalid or missing response from the API');
      }

      const gifUrl = response.data.url;

      const filePath = path.join(__dirname, `/cache/${category}_${Date.now()}.gif`);

      const writer = fs.createWriteStream(filePath);
      const responseStream = await axios.get(gifUrl, { responseType: 'stream' });

      responseStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const messageID = await api.sendMessage({
        body: '',
        attachment: fs.createReadStream(filePath)
      }, event.threadID, event.messageID);

      if (!messageID) {
        throw new Error('Failed to send message with attachment');
      }

      console.log(`sucess`);
    } catch (error) {
      console.error(`Failed`);
      api.sendMessage('Sorry, something went wrong. Please try again later.', event.threadID);
    }
  }
};
