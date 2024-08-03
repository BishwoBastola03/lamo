const axios = require('axios');
const jimp = require("jimp");
const { createCanvas, loadImage } = require('canvas');
const fs = require("fs");

module.exports = {
  config: {
    name: "rizz",
    aliases: [],
    version: "2.0",
    author: "Vex_Kshitiz",
    countDown: 10,
    role: 0,
    shortDescription: "rizz the girls",
    longDescription: "rizz the girls in diff way",
    category: "fun",
    guide: {
      en: "{prizz @mention",
    }
  },
    onStart: async function ({ message, args, api , event, user }) {
        const mention = Object.keys(event.mentions);
        if (mention.length == 0) return message.reply("please mention someone");
        else if (mention.length == 1) {
            const one = event.senderID, two = mention[0];
            const mentionName = event.mentions[mention[0]].split(' ')[0].replace('@', ''); 
            kshitiz(one, two, mentionName).then(ptth => { message.reply({ body: "", attachment: fs.createReadStream(ptth) }) })
        } else {
            const one = mention[1], two = mention[0];
            const mentionName = event.mentions[mention[0]].split(' ')[0].replace('@', ''); 
            kshitiz(one, two, mentionName).then(ptth => { message.reply({ body: "", attachment: fs.createReadStream(ptth) }) })
        }
    }
};

async function kshitiz(one, two, mentionName) {
    try {
        const pickupLine = await fetchPickupLine();

        const avatarOneWidth = 60;
        const avatarOneHeight = 60;
        const avatarTwoWidth = 50;
        const avatarTwoHeight = 50;

        const avatarOneX = 340;
        const avatarOneY = 30;
        const avatarTwoX = 180;
        const avatarTwoY = 70;

        const canvas = createCanvas(600, 300);
        const ctx = canvas.getContext('2d');

       
        const background = await loadImage("https://i.ibb.co/F0ckScv/Blade-Runner-2049-Color-Palette.jpg");
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

       
        const avOne = await loadAndRoundImage(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        const avTwo = await loadAndRoundImage(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

        
        ctx.drawImage(avOne, avatarOneX, avatarOneY, avatarOneWidth, avatarOneHeight);
        ctx.drawImage(avTwo, avatarTwoX, avatarTwoY, avatarTwoWidth, avatarTwoHeight);

      
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';

       
        ctx.fillText(`${mentionName} ${pickupLine}`, 30, 280); 

        
        const imagePath = "rizz.png";
        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        await new Promise((resolve, reject) => {
            out.once('finish', resolve);
            out.once('error', reject);
        });

        return imagePath;
    } catch (error) {
        console.error(`Failed to generate image: ${error.message}`);
        throw error;
    }
}

async function loadAndRoundImage(url) {
    const avatar = await jimp.read(url);
    avatar.circle();
    const roundedImageBuffer = await avatar.getBufferAsync(jimp.MIME_PNG);
    const roundedImage = await loadImage(roundedImageBuffer);
    return roundedImage;
}

async function fetchPickupLine() {
    try {
        const response = await axios.get('https://vinuxd.vercel.app/api/pickup');
        if (response.status !== 200 || !response.data || !response.data.pickup) {
            throw new Error('Invalid or missing response from pickup line API');
        }
        return response.data.pickup;
    } catch (error) {
        console.error(`Failed to fetch pickup line: ${error.message}`);
        return "Hey, are you a magician? Because whenever I look at you, everyone else disappears.";
    }
}
