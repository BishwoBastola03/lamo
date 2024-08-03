const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'vex',
    version: '1.0',
    author: 'Vex_Kshitiz',
    role: 0,
    description: {
      en: 'host your video for free in my github repo.',
    },
    category: 'owner',
    guide: {
      en: '{p}host reply to video',
    },
  },

  onStart: async function ({ message, api, event }) {
    api.setMessageReaction("✨", event.messageID, (err) => {}, true);
    try {
      if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
        return message.reply("Please reply to a video.");
      }

      const repliedVideoUrl = event.messageReply.attachments[0].url;
      const uniqueFilename = generateUniqueFilename();

      const apiEndpoint = 'https://vex-kshitiz-t04b.onrender.com/upload'; 
      const response = await axios.post(apiEndpoint, {
        videoUrl: repliedVideoUrl,
        filename: uniqueFilename,
      });

      const videoRawUrl = response.data.url;
      message.reply(videoRawUrl);

    } catch (error) {
      console.error('Error hosting video:', error);
      message.reply('❌ Failed to host the video.');
    }
  },
};
function generateUniqueFilename() {
  return `video-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
