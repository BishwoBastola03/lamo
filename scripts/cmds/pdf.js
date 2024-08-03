const fs = require('fs');
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');

const cacheFolder = path.join(__dirname, 'cache');

if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder);
}

module.exports = {
  config: {
    name: "pdf",
    version: "1.0",
    author: "Vex_Kshitiz",
    shortDescription: "Convert images to PDF",
    longDescription: "Convert multiple images to a PDF.",
    category: "image",
    guide: {
      en: "!pdf <name>"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    try {
      if (event.type !== "message_reply") {
        return message.reply("❌ || Reply to multiple images to convert them to a PDF.");
      }

      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length < 2 || !attachments.every(attachment => attachment.type === "photo")) {
        return message.reply("❌ || Please reply to at least two images.");
      }

      const pdfName = args[0];
      if (!pdfName) {
        return message.reply("❌ || Please provide a name for the PDF.");
      }

      const imagePaths = [];


      for (let i = 0; i < attachments.length; i++) {
        const imageUrl = attachments[i].url;
        const imagePath = path.join(cacheFolder, `image_${i}_${Date.now()}.jpg`);
        imagePaths.push(imagePath);

        const responseImage = await axios({
          url: imageUrl,
          method: 'GET',
          responseType: 'stream'
        });
        const writerImage = fs.createWriteStream(imagePath);
        responseImage.data.pipe(writerImage);

        await new Promise((resolve, reject) => {
          writerImage.on('finish', resolve);
          writerImage.on('error', reject);
        });
      }

      const pdfPath = path.join(cacheFolder, `${pdfName}.pdf`);

      const doc = new PDFDocument();
      const pdfWriter = fs.createWriteStream(pdfPath);
      doc.pipe(pdfWriter);

      for (const imagePath of imagePaths) {
        doc.addPage().image(imagePath, {
          fit: [500, 700],
          align: 'center',
          valign: 'center'
        });
      }

      doc.end();

      await new Promise((resolve, reject) => {
        pdfWriter.on('finish', resolve);
        pdfWriter.on('error', reject);
      });


      const pdfStream = fs.createReadStream(pdfPath);

      if (!event.threadID || !event.messageID) {
        return console.error("ThreadID or MessageID is not defined or invalid.");
      }

      console.log(`sent ${event.threadID}`);

      await api.sendMessage({
        body: `✅ || tap to download 👇`,
        attachment: pdfStream
      }, event.threadID);

      console.log("sent successfully.");

      imagePaths.forEach(imagePath => fs.unlinkSync(imagePath));

    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ || An error occurred.");
    }
  }
};
