const axios = require('axios');

module.exports = {
  config: {
    name: 't2e',
    version: '1.0',
    author: 'kshitiz',
    countDown: 5,
    role: 0,
    category: 'fun',
    shortDescription: {
      en: 'Converts text to emoji.'
    },
    longDescription: {
      en: 'Use this command to convert text to emoji.'
    },
    guide: {
      en: '{pn} t2e <text>'
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        throw new Error('Text not provided');
      }

      const text = encodeURIComponent(args.join(' '));
      const response = await axios.get(`https://t2e.vercel.app/t2i?text=${text}`);

      if (response.status !== 200 || !response.data || !response.data.emoji) {
        throw new Error('Invalid response from API');
      }

      const emoji = response.data.emoji;

      await api.sendMessage({
        body: emoji,
      }, event.threadID, event.messageID);

      console.log(`Sent`);
    } catch (error) {
      console.error(`Failed to convert text to emoji: ${error.message}`);
      api.sendMessage('Please try again later.', event.threadID, event.messageID);
    }
  }
};
