const axios = require("axios");
const { createReadStream, unlinkSync } = require("fs");
const { resolve } = require("path");

module.exports = {
	config: {
		name: "sendnoti",
		version: "1.4",
		author: "cliff",
		countDown: 5,
		role: 2,
		shortDescription: {
			vi: "Tạo và gửi thông báo đến các nhóm",
			en: "Create and send notification to groups",
		},
		longDescription: {
			vi: "Tạo và gửi thông báo đến các nhóm do bạn quản lý",
			en: "Create and send notification to groups that you manage",
		},
		category: "box chat",
	},

	onStart: async function ({ api, event, args }) {
		if (this.config.author !== "Mr perfect") {
			return api.sendMessage(
				`[ 𝗔𝗡𝗧𝗜 𝗖𝗛𝗔𝗡𝗚𝗘 𝗖𝗥𝗘𝗗𝗜𝗧𝗦 ]
				𝗔𝗗𝗠𝗜𝗡 𝗠𝗘𝗦𝗦𝗔𝗚𝗘: 
				𝙽𝚘𝚝𝚑𝚒𝚗𝚐
				𝗠𝗘𝗠𝗕𝗘𝗥 𝗠𝗘𝗦𝗦𝗔𝗚𝗘:
				𝙻𝚘𝚝𝚜 𝚘𝚏 𝚕𝚘𝚟𝚎 𝚏𝚘𝚛 𝚢𝚘𝚞 𝚐𝚞𝚢𝚜
				𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙑𝙞𝙖  
https://www.facebook.com/profile.php?id=61556771164358`,
				event.threadID,
				event.messageID
			);
		}

		const threadList = await api.getThreadList(100, null, ["INBOX"]);
		let sentCount = 0;
		const custom = args.join(" ");

		async function sendMessage(thread) {
			try {
				await api.sendMessage(
					`➜ 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗙𝗥𝗢𝗠 𝗔𝗗𝗠𝗜𝗡\n▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${custom}`,
					thread.threadID
				);
				sentCount++;

				const content = `${custom}`;
				const languageToSay = "tl";
				const pathFemale = resolve(
					__dirname,
					"cache",
					`${thread.threadID}_female.mp3`
				);

				await global.utils.downloadFile(
					`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
						content
					)}&tl=${languageToSay}&client=tw-ob&idx=1`,
					pathFemale
				);
				api.sendMessage(
					{ attachment: createReadStream(pathFemale) },
					thread.threadID,
					() => unlinkSync(pathFemale)
				);
			} catch (error) {
				console.error("Error sending a message:", error);
			}
		}

		for (const thread of threadList) {
			if (sentCount >= 20) {
				break;
			}
			if (
				thread.isGroup &&
				thread.name !== thread.threadID &&
				thread.threadID !== event.threadID
			) {
				await sendMessage(thread);
			}
		}

		if (sentCount > 0) {
			api.sendMessage(`› Sent the notification successfully.`, event.threadID);
		} else {
			api.sendMessage(
				"› No eligible group threads found to send the message to.",
				event.threadID
			);
		}
	},
};