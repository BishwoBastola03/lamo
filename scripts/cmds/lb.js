const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const cacheDir = path.join(__dirname, 'cache');

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

module.exports = {
  config: {
    name: "lb",
    aliases: ['langurburja', 'langurburza'],
    version: "1.0",
    author: "Vex_Kshitiz",
    role: 0,
    shortDescription: "langur burza game",
    longDescription: "play langur burza famous game played in Nepal.",
    category: "game",
    guide: {
      en: "{p}lb {cardnumber}-{amount}"
    }
  },

  onStart: async function ({ args, message, event, usersData }) {
    try {
      if (args.length === 1 && args[0].startsWith('-')) {
        const cardNumber = parseInt(args[0].substring(1));
        if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > 6) {
          return message.reply("Please provide a valid card number between 1 and 6.");
        }

        const cardSymbol = getLangurBurjaSymbol(cardNumber);
        const isGolden = cardNumber === 5 || cardNumber === 6;

        const cardImage = await generateLangurBurjaCard(cardSymbol, isGolden);
        const imagePath = await saveImageToCache(cardImage);
        return message.reply({ attachment: fs.createReadStream(imagePath) });
      }

      const [cardNumber, amount] = args[0].split('-').map(str => str.trim());
      const selectedCard = parseInt(cardNumber);
      const betAmount = parseInt(amount);

      if (isNaN(selectedCard) || isNaN(betAmount) || selectedCard < 1 || selectedCard > 6 || betAmount <= 0) {
        return message.reply("Please provide a valid card number and bet amount.");
      }

      const senderID = event.senderID;
      const userData = await usersData.get(senderID);

      if (betAmount > userData.money) {
        return message.reply("You don't have enough money to place this bet.");
      }

      const drawnCards = [];
      for (let i = 0; i < 6; i++) {
        drawnCards.push(Math.floor(Math.random() * 6) + 1);
      }

      const combinedImageURL = await drawCombinedImage(drawnCards);
      await message.reply({
        attachment: fs.createReadStream(combinedImageURL)
      });

      setTimeout(async () => {
        const countSelectedCard = drawnCards.filter(card => card === selectedCard).length;
        let winnings = 0;
        let lostAmount = betAmount;

        if (countSelectedCard > 1) {
          winnings = betAmount * countSelectedCard;
          lostAmount = 0;
        }

        await usersData.set(senderID, { money: userData.money + winnings - lostAmount });

        if (winnings > 0) {
          await message.reply(`✨Congratulations! You won ${winnings} coins.`);
        } else {
          await message.reply(`🥺Sorry, you lost ${lostAmount} coins.`);
        }
      }, 2000); 
    } catch (error) {
      console.error("Error in lb command:", error);
      message.reply("Please provide a valid input.\nex: !lb 1-500 : or !lb -1");
    }
  }
};

async function drawCombinedImage(drawnCards) {
  const cardWidth = 100;
  const cardHeight = 100; 

  const canvasWidth = cardWidth * 3;
  const canvasHeight = cardHeight * 2; 
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < drawnCards.length; i++) {
    const cardNumber = drawnCards[i];
    const cardSymbol = getLangurBurjaSymbol(cardNumber);
    const isGolden = cardNumber === 5 || cardNumber === 6;
    const cardImage = await generateLangurBurjaCard(cardSymbol, isGolden);
    const img = await loadImage(cardImage);

    const row = Math.floor(i / 3); 
    const col = i % 3; 

    const offsetX = col * cardWidth; 
    const offsetY = row * cardHeight; 
    
    ctx.drawImage(img, offsetX, offsetY, cardWidth, cardHeight);
  }

  const combinedImagePath = path.join(cacheDir, 'combined_image.png');
  const out = fs.createWriteStream(combinedImagePath);
  const stream = canvas.createPNGStream();
  const streamPromise = new Promise((resolve, reject) => {
    out.on('finish', () => {
      resolve(combinedImagePath);
    });
    out.on('error', (err) => {
      reject(err);
    });
  });
  stream.pipe(out);

  return streamPromise;
}

async function generateLangurBurjaCard(cardSymbol, isGolden) {
  const canvas = createCanvas(250, 250); 
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(1, 'black');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 100px Arial';
  if (cardSymbol === '♥' || cardSymbol === '♦') {
    ctx.fillStyle = 'red';
  } else if (cardSymbol === '♠' || cardSymbol === '♣') {
    ctx.fillStyle = 'black';
  } else {
    ctx.fillStyle = isGolden ? 'goldenrod' : 'rgb(128, 0, 128)';
  }
  ctx.textAlign = 'center';
  ctx.fillText(cardSymbol, canvas.width / 2, canvas.height / 2 + 30); 

  return canvas.toBuffer();
}

async function saveImageToCache(imageBuffer) {
  const imagePath = path.join(cacheDir, `langur_burja_${Date.now()}.png`);
  await fs.promises.writeFile(imagePath, imageBuffer);
  return imagePath;
}

function getLangurBurjaSymbol(cardNumber) {
  const symbols = ['♥', '♦', '♣', '♠', '⚑', '♚'];
  return symbols[cardNumber - 1];
}
