const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function fetchTikTokUserInfo(username) {
  try {
    const response = await axios.get(`https://tiktok-stalk-6p1b.onrender.com/kshitiz?username=${username}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user information:", error.message);
    throw new Error("Failed to fetch user information");
  }
}

async function savePostUrls(posts) {
  try {
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const jsonFilePath = path.join(tmpDir, 'post_urls.json');
    const cleanedUrls = posts.map(post => post.replace(/&signaturev3=[^&]*/, ''));
    fs.writeFileSync(jsonFilePath, JSON.stringify(cleanedUrls, null, 2));
    return jsonFilePath;
  } catch (error) {
    console.error("Error saving post", error.message);
    throw new Error("Failed to save post");
  }
}

async function downloadAvatar(avatarUrl) {
  try {
    const response = await axios.get(avatarUrl, { responseType: "stream" });
    const tmpDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filePath = path.join(tmpDir, `avatar_${Date.now()}.jpg`);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filePath));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading avatar:", error.message);
    throw new Error("Failed to download avatar");
  }
}

async function downloadPost(postUrl, index) {
  try {
    const tmpDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const fileName = path.join(tmpDir, `${Date.now()}_post_${index}.mp4`);

    const response = await axios.get(postUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(fileName);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(fileName));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading post:", error.message);
    throw new Error("Failed to download post");
  }
}

module.exports = {
  config: {
    name: "tikstalk",
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "stalk tiktok users",
    longDescription: "stalk tiktok users",
    category: "social",
    guide: "{p}tikstalk <username> / reply by number to see their post",
  },

  onStart: async function ({ api, event, args }) {
     api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const username = args[0];
      const userInfo = await fetchTikTokUserInfo(username);
      const avatarPath = await downloadAvatar(userInfo.user.avatar);

      const infoMessage = `✰ *Username:* ${userInfo.user.login_name}
✰ *Full Name:* ${userInfo.user.name}
✰ *Total Followers:* ${userInfo.user.followers}
✰ *Following:* ${userInfo.user.following}
✰ *Total Profile Hearts:* ${userInfo.user.likes}
✰ *Total Videos:* ${userInfo.user.total_video}`;

      const avatarStream = fs.createReadStream(avatarPath);
      api.sendMessage({ body: infoMessage, attachment: avatarStream }, event.threadID, (err, info) => {
        savePostUrls(userInfo.posts)
          .then(() => {
            const posts = userInfo.posts.map(post => post.replace(/&signaturev3=[^&]*/, ''));
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "tikstalk",
              messageID: info.messageID,
              posts: posts,
            });
          })
          .catch(error => {
            console.error("Error saving post", error.message);
          });
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "Sorry, an error occurred." }, event.threadID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { commandName, messageID, posts } = Reply;

    if (commandName !== "tikstalk" || !posts || !Array.isArray(posts) || posts.length === 0) {
      return;
    }

    const postIndex = parseInt(args[0], 10);

    if (isNaN(postIndex) || postIndex < 1 || postIndex > posts.length) {
      api.sendMessage({ body: "Invalid input.\nPlease provide a valid number.\nfrom 1 - 10" }, event.threadID, messageID);
      return;
    }

    try {
      const postUrl = posts[postIndex - 1];
      const postPath = await downloadPost(postUrl, postIndex);
      const postStream = fs.createReadStream(postPath);
      api.sendMessage({ body: "", attachment: postStream }, event.threadID, messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred while processing the video.\nPlease try again later." }, event.threadID);
    } finally {
      //global.GoatBot.onReply.delete(messageID);  
    }
  },
};
