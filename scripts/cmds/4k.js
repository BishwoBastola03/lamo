const { GoatWrapper } = require('fca-liane-utils');
const axios = require('axios');
const tinyurl = require('tinyurl');

module.exports = {
	config: {
		name: "4k",
		aliases: ["4k", "remini"],
		version: "1.0",
		author: "JARiF",
		countDown: 15,
		role: 0,
		longDescription: "Upscale your image.",
		category: "image",
		guide: {
			en: "{pn} reply to an image"
		}
	},

	onStart: async function ({ message, args, event, api }) {
		const getImageUrl = () => {
			if (event.type === "message_reply") {
				const replyAttachment = event.messageReply.attachments[0];
				if (["photo", "sticker"].includes(replyAttachment?.type)) {
					return replyAttachment.url;
				} else {
					throw new Error("¯\ |(●’◡’●)ﾉ | 𝘙𝘦𝘱𝘭𝘺 𝘵𝘰 𝘢𝘯 𝘪𝘮𝘢𝘨𝘦 𝘳𝘦𝘲𝘶𝘪𝘳𝘦𝘥");
				}
			} else if (args[0]?.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/g) || null) {
				return args[0];
			} else {
				throw new Error("(⁠┌⁠・⁠。⁠・⁠)⁠┌ | Reply to an image.");
			}
		};

		try {
			const imageUrl = await getImageUrl();
			const shortUrl = await tinyurl.shorten(imageUrl);

			message.reply("༼ つ ◕◡◕ ༽つ | 𝘐𝘯𝘪𝘵𝘪𝘢𝘵𝘪𝘯𝘨 𝘢𝘯 𝘳𝘦𝘲𝘶𝘦𝘴𝘵..");

			const response = await axios.get(`https://www.api.vyturex.com/upscale?imageUrl=${shortUrl}`);
			const resultUrl = response.data.resultUrl;

			message.reply({ body: "(•̀ᴗ•́)و |𝘙𝘦𝘲𝘶𝘦𝘴𝘵 𝘤𝘰𝘮𝘱𝘭𝘦𝘵𝘦𝘥", attachment: await global.utils.getStreamFromURL(resultUrl) });
		} catch (error) {
			message.reply("┐⁠(⁠￣⁠ヘ⁠￣⁠)⁠┌ | 𝘌𝘳𝘳𝘰𝘳 𝘋𝘦𝘵𝘦𝘤𝘵𝘦𝘥 " + error.message);
			// Log error for debugging: console.error(error);
		}
	}
};
const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });