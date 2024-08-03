const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "fbviewer",
        aliases: ["fv"],
        version: "1.0",
        author: "Vex_kshitiz",
        countDown: 5,
        role: 0,
        shortDescription: "View Facebook profile",
        longDescription: "View Facebook profiles",
        category: "fun",
        guide: "{p}fbviewer {uid or mention}"
    },

    onStart: async function ({ event, message, usersData, api, args }) {
        let uid;

        if (args[0]) {
            if (/^\d+$/.test(args[0])) {
                uid = args[0];
            } else {
                const match = args[0].match(/profile\.php\?id=(\d+)/);
                if (match) {
                    uid = match[1];
                }
            }
        }

        if (!uid) {
            uid = event.type === "message_reply" ? event.messageReply.senderID : Object.keys(event.mentions)[0] || event.senderID;
        }

        try {
            const userInfo = await new Promise((resolve, reject) => {
                api.getUserInfo(uid, (err, result) => {
                    if (err) return reject(err);
                    resolve(result[uid]);
                });
            });

            const avatarUrl = await usersData.getAvatarUrl(uid);

            const canvasSize = 1080;
            const canvas = createCanvas(canvasSize, canvasSize);
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
            gradient.addColorStop(0, '#fafafa');
            gradient.addColorStop(1, '#e0e0e0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            const profilePic = await loadImage(avatarUrl);
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
            ctx.fillText(userInfo.name, canvasSize / 2, profilePicY + profilePicSize + 80);

            const genderText = userInfo.gender == 1 ? "Girl" : userInfo.gender == 2 ? "Boy" : "Unknown";

            ctx.font = '24px Helvetica';
            ctx.fillText(`Gender: ${genderText}`, canvasSize / 2, profilePicY + profilePicSize + 160);

            const bioMaxWidth = canvasSize - 160;
            const bioX = 580;
            const bioY = profilePicY + profilePicSize + 200;
            const bioLines = splitText(ctx, `User Type: ${userInfo.type}\nIs Friend: ${userInfo.isFriend ? "Yes" : "No"}\nIs Birthday today: ${userInfo.isBirthday ? "Yes" : "No"}`, bioMaxWidth);
            ctx.font = '18px Helvetica';
            ctx.fillStyle = '#262626';
            bioLines.forEach((line, index) => {
                ctx.fillText(line, bioX, bioY + index * 25);
            });

            const outputPath = path.join(__dirname, 'cache', `${uid}-fbviewer.png`);
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', () => {
                console.log('Facebook profile image created successfully!');
                message.reply({
                    body: '',
                    attachment: fs.createReadStream(outputPath)
                }, () => fs.unlinkSync(outputPath));
            });
        } catch (err) {
            console.error('Error in onStart fbviewer', err);
            message.reply("An error occurred while fetching the profile details.");
        }
    }
};

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
