const axios = require('axios');

module.exports = {
  config: {
    name: "nhentai",
    aliases: ["nhentai"],
    version: "1.0",
    author: "jfhigtfdv",
    countDown: 5,
    role: 0,
    longDescription: {
      vi: '',
      en: "Search and read doujins from nhentai"
    },
    category: "anime",
    guide: {
      vi: '',
      en: "{pn} <content>"
    }
  },

  onStart: async function ({ api, commandName, event }) {
    return api.sendMessage("Search Doujin\n--------------------------\n(Reply to this message)", event.threadID, (error, message) => {
      global.GoatBot.onReply.set(message.messageID, {
        commandName: commandName,
        author: event.senderID,
        messageID: message.messageID,
        type: "search",
        pagetype: false,
        page: 1,
        searchStatus: true
      });
    }, event.messageID);
  },

  onReply: async function ({ Reply, api, event, args }) {
    try {
      const { commandName, author, messageID, type } = Reply;
      if (event.senderID != author) {
        return;
      }
      if (type == "search") {
        let currentPage = Reply.page;
        if (Reply.pagetype == true) {
          if (args[0]?.toLowerCase() === "page" && args[1] > 0) {
            currentPage = args[1];
          } else if (args[0]?.toLowerCase() === "select" && args[1] > 0) {
            const index = args[1] - 1;
            const selectedData = Reply.currentPageData[index];
            if (selectedData) {
              api.setMessageReaction('⏳', event.messageID, () => {}, true);
              const response = await axios.get('https://n-hentai.vercel.app/doujin/' + selectedData.id);
              const doujinInfo = response.data;
              const description = `Title: ${doujinInfo.title}\n\nTags: ${doujinInfo.tags.join(", ")}\n\nPages: ${doujinInfo.pages.length}\n\n(Reply with "read" to read this doujin or "done" to exit)`;
              return api.sendMessage(description, event.threadID, (error, message) => {
                api.setMessageReaction('', event.messageID, () => {}, true);
                global.GoatBot.onReply.set(message.messageID, {
                  commandName: commandName,
                  author: author,
                  messageID: message.messageID,
                  type: "read",
                  doujinInfo: doujinInfo
                });
              }, event.messageID);
            } else {
              return api.sendMessage("Invalid item number⚠️", event.threadID, event.messageID);
            }
          } else {
            return args[0]?.toLowerCase() == "done" ? api.unsendMessage(messageID) && api.setMessageReaction('✅', event.messageID, () => {}, true) : api.sendMessage("Invalid input!⚠️\nEx: Page 2/Select 2/Done", event.threadID, event.messageID);
          }
        }

        let searchData = [];
        let resultData = searchData;
        if (Reply.searchStatus == true) {
          const search = event.body;
          const cleanSearch = search.replace(/[\/\\:]/g, '');
          api.setMessageReaction('⏳', event.messageID, () => {}, true);
          const searchResult = await axios.get('https://n-hentai.vercel.app/search?q=' + cleanSearch);
          const results = searchResult.data;
          if (!results.length) {
            return api.sendMessage("No results found!", event.threadID, () => {
              api.setMessageReaction('⚠️', event.messageID, () => {}, true);
            }, event.messageID);
          }
          results.forEach(item => {
            searchData.push({
              id: item.id,
              description: `Title: ${item.title}\nTags: ${item.tags.join(", ")}\nPages: ${item.pages}`
            });
          });
        } else {
          searchData = Reply.resultString;
          resultData = Reply.resultString;
        }
        const totalPages = Math.ceil(resultData.length / 5);
        let resultPage = '';
        let selectedData;
        if (currentPage < 1 || currentPage > totalPages) {
          return api.sendMessage(`Page ${currentPage} does not exist.\nTotal pages: ${totalPages}`, event.threadID, event.messageID);
        } else {
          selectedData = await paginate(resultData, currentPage, 5);
          selectedData.forEach((data, index) => {
            resultPage += `${index + 1}. ${data.description}\n`;
          });
        }
        await api.unsendMessage(messageID);
        return api.sendMessage(`Results:\n--------------------------\n${resultPage}Current page ${currentPage} of ${totalPages} page/s.\n(Reply to this message. Ex: Page 2/Select 2/Done)`, event.threadID, (error, message) => {
          global.GoatBot.onReply.set(message.messageID, {
            commandName: commandName,
            author: author,
            messageID: message.messageID,
            resultString: searchData,
            type: 'search',
            pagetype: true,
            page: currentPage,
            searchStatus: false,
            currentPageData: selectedData
          });
          api.setMessageReaction('', event.messageID, () => {}, true);
        }, event.messageID);
      } else if (type == 'read') {
        let selectedPage;
        if (args[0]?.toLowerCase() === 'read') {
          selectedPage = 0;
        } else if (args[0]?.toLowerCase() === 'done') {
          return api.unsendMessage(messageID) && api.setMessageReaction('✅', event.messageID, () => {}, true);
        } else {
          return api.sendMessage("Invalid input!⚠️\nEx: Read/Done", event.threadID, event.messageID);
        }

        const pages = Reply.doujinInfo.pages;
        if (selectedPage < 0 || selectedPage >= pages.length) {
          return api.sendMessage("Invalid page number⚠️", event.threadID, event.messageID);
        }

        api.setMessageReaction('⏳', event.messageID, async () => {
          try {
            const imageStreams = await Promise.all(pages.map(url => global.utils.getStreamFromURL(url)));
            for (let i = 0; i < imageStreams.length; i += 30) {
              const batchImages = imageStreams.slice(i, i + 30);
              const messageBody = {
                body: '',
                attachment: batchImages
              };
              await api.sendMessage(messageBody, event.threadID);
            }
            await api.setMessageReaction('', event.messageID, () => {}, true);
          } catch (error) {
            return api.sendMessage("Something went wrong", event.threadID, event.messageID) && api.setMessageReaction('⚠️', event.messageID, () => {}, true);
          }
        }, true);
      }
    } catch (error) {
      return api.sendMessage("Error: " + error, event.threadID, event.messageID) && api.setMessageReaction('⚠️', event.messageID, () => {}, true);
    }
  }
};

async function paginate(data, currentPage, perPage) {
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  return data.slice(startIndex, endIndex);
}
