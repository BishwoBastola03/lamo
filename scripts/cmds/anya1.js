

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function anya(api, event, args, message) {
  try {
    const text = args.join(" ").trim();

    if (!text) {
      return message.reply("ex: {p}anya {your question}");
    }

    const response = await axios.get(`https://anya-voiceai.vercel.app/kshitiz?text=${encodeURIComponent(text)}`);
    const { text: audioText, mp3Url } = response.data;

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, 'cache', fileName);

    const audioResponse = await axios({
      url: mp3Url,
      method: 'GET',
      responseType: 'stream'
    });

    await fs.ensureDir(path.dirname(filePath));

    const writer = fs.createWriteStream(filePath);
    audioResponse.data.pipe(writer);

    writer.on('finish', async () => {
      try {
        const sentMessage = await message.reply({
          body: `${audioText}`,
          attachment: fs.createReadStream(filePath)
        });
        global.GoatBot.onReply.set(sentMessage.messageID, {
          commandName: anyaCommand.name,
          uid: event.senderID
        });
      } catch (error) {
        console.error('Error sending message:', error.message);
        message.reply("An error occurred while sending the audio file.");
      } finally {
        await fs.unlink(filePath);
      }
    });

    writer.on('error', (err) => {
      console.error('Error writing the audio file:', err.message);
      message.reply("An error occurred while processing the audio file.");
    });

  } catch (error) {
    console.error('Error:', error.message);
    message.reply("An error occurred while processing your request.");
  }
}

function handleReply(api, event, args, message) {
  const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);

  if (replyData && replyData.uid === event.senderID) {
    global.GoatBot.onReply.delete(event.messageReply.messageID);
    return anya(api, event, args, message);
  }
}

const anyaCommand = {
  name: 'anya1',
  version: '2.0',
  author: 'Vex_Kshitiz',
  role: 0,
  longDescription: 'anya forger ai.',
  category: 'ai',
  guide: {
    en: '{p}anya {text}'
  }
};

module.exports = {
  config: anyaCommand,
  handleCommand: anya,
  onStart: function ({ api, message, event, args }) {
    return anya(api, event, args, message);
  },
   onReply: function ({ api, message, event, args }) {
      if (event.type === 'message_reply' && event.messageReply.attachments.length > 0) {
        return handleReply(api, event, args, message);
      }
    }
  };
