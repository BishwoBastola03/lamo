const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "instaviewer",
        aliases: ["iv"],
        version: "1.0",
        author: "Vex_kshitiz",
        countDown: 5,
        role: 0,
        shortDescription: "View Instagram profile",
        longDescription: "view insta profiles",
        category: "fun",
        guide: "{p}instaviewer {username}"
    },

    onStart: async function ({ event, message, args }) {
        const username = args[0];

        if (!username) {
            return message.reply("Please provide a username.");
        }

        try {
            const apiUrl = `https://vex-insta.vercel.app/view?username=${username}`;
            const response = await axios.get(apiUrl);
            const profile = response.data;

            const canvasSize = 1080;
            const canvas = createCanvas(canvasSize, canvasSize);
            const ctx = canvas.getContext('2d');

         
            const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
            gradient.addColorStop(0, '#fafafa'); 
            gradient.addColorStop(1, '#e0e0e0'); 
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            const profilePic = await loadImage(profile.profilePicUrl);
            const profilePicSize = 300;
            const profilePicX = (canvasSize - profilePicSize) / 2;
            const profilePicY = 80;

            const centerX = profilePicX + profilePicSize / 2;
            const centerY = profilePicY + profilePicSize / 2;
            const radius = profilePicSize / 2;

           
            const borderGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius);
            borderGradient.addColorStop(0, '#FF4081'); 
            borderGradient.addColorStop(0.3, '#7E57C2'); 
            borderGradient.addColorStop(0.6, '#42A5F5'); 
            borderGradient.addColorStop(1, '#FFEB3B'); 

            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = borderGradient;
            ctx.lineWidth = 10;
            ctx.stroke();
            ctx.closePath();

          
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(profilePic, profilePicX, profilePicY, profilePicSize, profilePicSize);
            ctx.restore();

         
            ctx.fillStyle = '#262626'; 
            ctx.font = 'bold 48px Helvetica'; 
            ctx.textAlign = 'center';
            ctx.fillText(profile.username, canvasSize / 2, profilePicY + profilePicSize + 80);

            const buttonY = profilePicY + profilePicSize + 200;
            const buttonWidth = 180;
            const buttonHeight = 50;
            const buttonMargin = 20;
            const buttonXFollow = (canvasSize / 2) - buttonWidth - buttonMargin / 2;
            const buttonXMessage = (canvasSize / 2) + buttonMargin / 2;

           
            drawRoundedRect(ctx, buttonXFollow, buttonY, buttonWidth, buttonHeight, 10, '#3897F0');
            drawRoundedRect(ctx, buttonXMessage, buttonY, buttonWidth, buttonHeight, 10, '#262626'); 

          
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Helvetica';
            ctx.fillText('Follow', buttonXFollow + buttonWidth / 2, buttonY + buttonHeight / 2 + 7);
            ctx.fillText('Message', buttonXMessage + buttonWidth / 2, buttonY + buttonHeight / 2 + 7);

           
            ctx.font = '24px Helvetica';
            ctx.fillStyle = '#262626';
            ctx.fillText(`${formatCount(profile.followerCount)} Followers  ${formatCount(profile.followingCount)} Following`, canvasSize / 2, profilePicY + profilePicSize + 160);

          
            ctx.font = '24px Helvetica';
            ctx.fillText(profile.fullName, canvasSize / 2, buttonY + buttonHeight + 80);

            const bioMaxWidth = canvasSize - 160; 
            const bioX = 620;
            const bioY = buttonY + buttonHeight + 140;
            const bioLines = splitText(ctx, profile.biography, bioMaxWidth);
            ctx.font = '18px Helvetica';
            ctx.fillStyle = '#262626';
            bioLines.forEach((line, index) => {
                ctx.fillText(line, bioX, bioY + index * 25);
            });

            
            const outputPath = path.join(__dirname, 'cache', `${username}-instaviewer.png`);
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', () => {
                console.log('Instagram profile image created successfully!');
                message.reply({
                    body: '',
                    attachment: fs.createReadStream(outputPath)
                }, () => fs.unlinkSync(outputPath));
            });
        } catch (err) {
            console.error('Error in onStart instaviewer', err);
            message.reply("An error occurred while fetching the profile details.");
        }
    }
};

function formatCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count;
}

function splitText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;

        if (width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine += ' ' + word;
        }
    }

    if (currentLine !== '') {
        lines.push(currentLine.trim());
    }

    return lines;
}

function drawRoundedRect(ctx, x, y, width, height, radius, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}
