const fetch = require('node-fetch');
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const apiEndpoint = 'https://api.cracked.systems/v1/images/generations';
const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer Vy3QaRMyQu8rKypX'
};

async function generateImages(prompt) {
    const data = {
        model: 'stable-diffusion-3',
        prompt,
        n: 2
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        const jsonData = await response.json();
        return jsonData.data.map(image => image.url);
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = {
    config: {
        name: "sd3",
        aliases: ["imagine"],
        version: "1.0.3",
        author: "Shikaki",
        role: 0,
        countDown: 30,
        description: {
            en: "Use if you want to generate realistic images.",
        },
        category: "image-gen-ai",
        guide: {
            en: "{pn} <image-description>\n\nUses stable diffusion 3.",
        },
    },
    onStart: async function ({ api, event, message, args }) {
        const prompt = args.join(" ");

        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
            const urls = await generateImages(prompt);

            if (!urls || urls.length === 0) {
                throw new Error("No images were generated");
            }

            const tmpDir = path.join(__dirname, 'tmp');
            await fs.ensureDir(tmpDir);

            const imgData = [];

            for (let i = 0; i < urls.length; i++) {
                const imgResponse = await axios.get(urls[i], { responseType: 'arraybuffer' });
                const imgPath = path.join(tmpDir, `${i + 1}.jpg`);
                await fs.outputFile(imgPath, imgResponse.data);
                imgData.push(fs.createReadStream(imgPath));
            }

            await message.reply({
                attachment: imgData
            });

            await fs.remove(tmpDir);

            api.setMessageReaction("✅", event.messageID, () => { }, true);
        } catch (error) {
            let errorMessage = error.message;
            if (error.config && error.config.url) {
                const url = error.config.url;
                errorMessage += ` URL: ${url}`;
            }
            console.error(errorMessage);
            api.setMessageReaction("❌", event.messageID, () => { }, true);
            return message.reply(`An error occurred: ${errorMessage}`);
        }
    }
}
