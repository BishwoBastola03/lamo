const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");


const profileSize = 35; // change size according to gc members. if image frame doesnt match

module.exports = {
  config: {
    name: "gcstats",
    version: "1.0",
    author: "Kshitiz",
    countDown: 5,
    role: 2,
    shortDescription: "Get gc stats",
    longDescription: "",
    category: "box",
    guide: {
      en: "{p}{n}",
    },
  },

  onStart: async function ({ api, event, usersData, message }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = threadInfo.participantIDs;
      const adminIDs = threadInfo.adminIDs.map((admin) => admin.id);

      const memberProfileImages = await Promise.all(
        participantIDs.map(async (participantID) => {
          const avatarUrl = await usersData.getAvatarUrl(participantID);
          return axios.get(avatarUrl, { responseType: "arraybuffer" });
        })
      );

      const adminProfileImages = [];
      const memberProfileImagesFiltered = [];

      for (let i = 0; i < participantIDs.length; i++) {
        const participantID = participantIDs[i];
        const response = memberProfileImages[i];

        if (adminIDs.includes(participantID)) {
          adminProfileImages.push(response);
        } else {
          memberProfileImagesFiltered.push(response);
        }
      }

      const numAdmins = adminProfileImages.length;
      const numMembers = memberProfileImagesFiltered.length;

      const maxMembers = 250;
      const maxProfileSize = 8;
      const minProfileSize = 2;

      const profileImageSize = profileSize; 

      const maxImagesPerRow = 15; // change it according to your choice
      const gapBetweenImages = 10;

      const numRows = Math.ceil((numAdmins + numMembers) / maxImagesPerRow);

      const totalProfileImagesHeight = numRows * (profileImageSize + gapBetweenImages);
      const canvasWidth = maxImagesPerRow * (profileImageSize + gapBetweenImages) - gapBetweenImages + 2;
      const canvasHeight = totalProfileImagesHeight + 100;

      const canvas = createCanvas(canvasWidth, canvasHeight, 'png');
      const ctx = canvas.getContext("2d", { antialias: "subpixel" });

    
      ctx.fillStyle = "#CCCCCC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let x = 10;
      let y = 0;

      const threadImageSize = profileImageSize * 2;
      const threadImageX = (canvasWidth - threadImageSize) / 2;
      const threadImageY = gapBetweenImages;

      const threadImageResponse = await axios.get(threadInfo.imageSrc, { responseType: "arraybuffer" });
      const threadImage = await loadImage(threadImageResponse.data);

      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, threadImageY + threadImageSize / 2, threadImageSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(threadImage, threadImageX, threadImageY, threadImageSize, threadImageSize);
      ctx.restore();

      
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, threadImageY + threadImageSize / 2, threadImageSize / 2 + 3, 0, Math.PI * 2, true);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.stroke();

      
      const threadNameFontSize = Math.min(24, (canvasWidth / threadInfo.threadName.length) * 0.7);
      ctx.fillStyle = "black";
      ctx.font = `${threadNameFontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(threadInfo.threadName, canvasWidth / 2, threadImageY + threadImageSize + 20);

      y += threadImageY + threadImageSize + 40;
      x = 10;

      let colIndex = 0;
      for (let i = 0; i < numAdmins; i++) {
        const response = adminProfileImages[i];
        const image = await loadImage(response.data);

        
        ctx.strokeStyle = "gold";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, profileImageSize, profileImageSize);

      
        ctx.drawImage(image, x + 4, y + 4, profileImageSize - 8, profileImageSize - 8);

        colIndex++;
        x += profileImageSize + gapBetweenImages - 5;

        if (colIndex >= maxImagesPerRow) {
          colIndex = 0;
          x = 10;
          y += profileImageSize + gapBetweenImages - 5;
        }
      }

      for (let i = 0; i < numMembers; i++) {
        const response = memberProfileImagesFiltered[i];
        const image = await loadImage(response.data);

      
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, profileImageSize, profileImageSize);

      
        ctx.drawImage(image, x + 4, y + 4, profileImageSize - 8, profileImageSize - 8);

        colIndex++;
        x += profileImageSize + gapBetweenImages - 5;

        if (colIndex >= maxImagesPerRow) {
          colIndex = 0;
          x = 10;
          y += profileImageSize + gapBetweenImages - 5;
        }
      }

      
      const leftTextOffsetX = 15;
      const rightTextOffsetX = 3;
      const textOffsetY = 20;
      ctx.fillStyle = "black";
      ctx.font = "8px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Admins: ${numAdmins}`, leftTextOffsetX, textOffsetY);
      ctx.textAlign = "right";
      ctx.fillText(`Members: ${numMembers}`, canvasWidth - rightTextOffsetX, textOffsetY);

    
      applyContrastFilter(ctx, canvas);

  
      const outputFile = __dirname + "/cache/group_members.png";
      const out = fs.createWriteStream(outputFile);
      const stream = canvas.createPNGStream({ compressionLevel: 6 });
      stream.pipe(out);

      out.on("finish", () => {
        message.reply(
          {
            body: "Group Members:",
            attachment: fs.createReadStream(outputFile),
          },
          event.threadID
        );
      });
    } catch (error) {
      console.error("Error:", error);
    }
  },
};

function applyContrastFilter(ctx, canvas) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

 
  const factor = (259 * (50 + 128)) / (128 * (259 - 50));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }

  ctx.putImageData(imageData, 0, 0);
}
