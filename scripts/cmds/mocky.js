const axios = require('axios');
const fs = require('fs');

async function postData(content) {
  try {
    const response = await axios.post('https://api.mocky.io/api/mock', {
      status: 200,
      content,
      content_type: 'application/json',
      charset: 'UTF-8',
      secret: 'Y6PFNNYJO2DCCF4EOmTeB7C7LuWCX0SaIx52',
      expiration: "1year"
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  config: {
    name: "mocky",
    version: "1.0",
    author: "Shikaki | Base code: OtinXShiva",
    countDown: 5,
    role: 2,
    description: "Upload the code to runmocky",
    category: "owner",
    guide: "{pn} file_name"
  },

  onStart: async function ({ message, args, api, event }) {
    try {
      const fileName = args[0];
      if (!fileName) {
        return api.sendMessage("Please provide a file name.", event.threadID, event.messageID);
      }
      const filePath = __dirname + `/${fileName}.js`;
      if (!fs.existsSync(filePath)) {
        return api.sendMessage(`File not found: ${fileName}.js`, event.threadID, event.messageID);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const response = await postData(fileContent);
      if (response) {
        message.reply(response.data.link);
      }
    } catch (error) {
      console.error(error);
      api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
