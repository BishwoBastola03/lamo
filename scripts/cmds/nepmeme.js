const axios = require("axios");
const fs = require("fs-extra");
const cheerio = require("cheerio");

module.exports = {
  config: {
    name: 'nepmeme',
    aliases: ['nepalimeme'],
    version: '1.0',
    author: 'Vex_Kshitiz',
    countDown: 5,
    role: 0,
    shortDescription: '',
    longDescription: 'Get Nepali memes',
    category: 'fun',
    guide: {
      en: '{p}{n}',
    }
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;

    const isAuthorValid = await checkAuthor(this.config.author);
    if (!isAuthorValid) {
      await api.sendMessage("Author changer alert! This cmd belongs to Vex_Kshitiz.", threadID);
      return;
    }

    try {
      api.setMessageReaction("🕐", event.messageID, () => {}, true);

      const memePostUrl = "https://nep-meme.vercel.app/kshitiz";
      const memePostResponse = await axios.get(memePostUrl);

      if (memePostResponse.data.url) {
        const facebookVideoUrl = memePostResponse.data.url;
        console.log(`Facebook Video URL: ${facebookVideoUrl}`);

        const downloadResponse = await fbDownloader(facebookVideoUrl);

        if (downloadResponse.success && downloadResponse.download.length > 0) {
          const downloadLinks = downloadResponse.download;
          const videoLink = downloadLinks.find(link => link.quality === '720p (HD)');

          if (videoLink && videoLink.url) {
            const videoUrl = videoLink.url;
            console.log(`720p Video URL: ${videoUrl}`);

            const videoPath = __dirname + `/cache/nepmeme.mp4`;
            await this.downloadVideo(videoUrl, videoPath);

            if (fs.existsSync(videoPath)) {
              await api.sendMessage({
                body: "",
                attachment: fs.createReadStream(videoPath),
              }, threadID, event.messageID);

              fs.unlinkSync(videoPath);
            } else {
              api.sendMessage("Error downloading the video.", threadID);
            }
          } else {
            api.sendMessage("720p video not found.", threadID);
          }
        } else {
          api.sendMessage("Error fetching download links.", threadID);
        }
      } else {
        api.sendMessage("Error fetching Facebook video URL.", threadID);
      }
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred.", threadID);
    }
  },

  downloadVideo: async function (url, path) {
    try {
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "arraybuffer"
      });

      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));
    } catch (error) {
      console.error(error);
    }
  },
};

async function fbDownloader(url) {
  try {
    const response1 = await axios({
      method: 'POST',
      url: 'https://snapsave.app/action.php?lang=vn',
      headers: {
        "accept": "*/*",
        "accept-language": "vi,en-US;q=0.9,en;q=0.8",
        "content-type": "multipart/form-data",
        "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": "https://snapsave.app/vn",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      data: {
        url
      }
    });

    console.log('Facebook Downloader Response:', response1.data);

    let html;
    const evalCode = response1.data.replace('return decodeURIComponent', 'html = decodeURIComponent');
    eval(evalCode);
    html = html.split('innerHTML = "')[1].split('";\n')[0].replace(/\\"/g, '"');

    const $ = cheerio.load(html);
    const download = [];

    const tbody = $('table').find('tbody');
    const trs = tbody.find('tr');

    trs.each(function (i, elem) {
      const trElement = $(elem);
      const tds = trElement.children();
      const quality = $(tds[0]).text().trim();
      const url = $(tds[2]).children('a').attr('href');
      if (url != undefined) {
        download.push({
          quality,
          url
        });
      }
    });

    return {
      success: true,
      video_length: $("div.clearfix > p").text().trim(),
      download
    };
  } catch (err) {
    console.error('Error in Facebook Downloader:', err);
    return {
      success: false
    };
  }
}

async function checkAuthor(authorName) {
  try {
    const response = await axios.get('https://author-check.vercel.app/name');
    const apiAuthor = response.data.name;
    return apiAuthor === authorName;
  } catch (error) {
    console.error("Error checking author:", error);
    return false;
  }
}
