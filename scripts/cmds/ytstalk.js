const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchYouTubeChannelInfo(channelName) {
  const apiUrl = `https://yt-stalk.vercel.app/info?channel=${encodeURIComponent(channelName)}`;

  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube channel information:', error);
    return null;
  }
}

module.exports = {
  config: {
    name: "ytstalk",
    aliases: ["ytinfo"],
    author: "Vex_Kshitiz",
    version: "1.0",
    shortDescription: {
      en: "Get information about a YouTube channel.",
    },
    longDescription: {
      en: "Fetches information about a YouTube channel.",
    },
    category: "INFO",
    guide: {
      en: "{p}ytstalk {channelName}",
    },
  },
  onStart: async function ({ api, event, args }) {
    const channelName = args.join(' ');

    if (!channelName) {
      api.sendMessage({ body: 'Please provide a YouTube channel name.' }, event.threadID, event.messageID);
      return;
    }

    try {
      const channelInfo = await fetchYouTubeChannelInfo(channelName);

      if (!channelInfo) {
        api.sendMessage({ body: `No information found for the YouTube channel: ${channelName}.` }, event.threadID. event.messageID);
        return;
      }

      const avatarUrl = channelInfo.channelInfo.avatar.thumbnails[0].url;
      const message = `✰ *Channel ID:* ${channelInfo.channelId}
✰ *Country:* ${channelInfo.channelInfo.country}
✰ *info:* ${channelInfo.channelInfo.description}
✰ *creation date:* ${channelInfo.channelInfo.joinedDateText}
✰ *Links:* ${channelInfo.channelInfo.links.map(link => `${link.title}: ${link.url}`).join('\n')}
✰ *Subscribers:* ${channelInfo.channelInfo.subscriberCountText}
✰ *channel:* ${channelInfo.channelInfo.title}
✰ *total videos:* ${channelInfo.channelInfo.viewCountText}`;

      const imageFilePath = path.join(__dirname, 'avatar.jpg');
      const imageStream = fs.createWriteStream(imageFilePath);
      const imageResponse = await axios.get(avatarUrl, { responseType: 'stream' });
      imageResponse.data.pipe(imageStream);

      imageStream.on('finish', () => {
        api.sendMessage({ body: message, attachment: fs.createReadStream(imageFilePath) }, event.threadID, event.messageID);
      });
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: 'An error occurred.\nplease check the channel name properly.' }, event.threadID, event.messageID);
    }
  },
};
