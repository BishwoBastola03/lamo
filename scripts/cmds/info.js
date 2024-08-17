const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
	config: {
		name: "info",
		version: "1.0",
		author:"perfect",
		countDown: 20,
		role: 0,
		shortDescription: { vi: "", en: "" },
		longDescription: { vi: "", en: "" },
		category: "owner",
		guide: { en: "" },
		envConfig: {}
	},
	onStart: async function ({ message }) {
		const botName = "An ya";
		const authorName = "Mr perfect";
		const pre = "+" ;
		const urls = JSON.parse(fs.readFileSync('perfect-god.json'));
		const link = urls[Math.floor(Math.random() * urls.length)];
		const now = moment().tz('Asia/Kathmandu');
		const date = now.format('YYYY MM Do');
		const time = now.format('h:mm:ss A');
		const uptime = process.uptime();
		const seconds = Math.floor(uptime % 60);
		const minutes = Math.floor((uptime / 60) % 60);
		const hours = Math.floor((uptime / (60 * 60)) % 24);
		const days = Math.floor(uptime / (60 * 60 * 24));
		const uptimeString = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;

		message.reply({
			body: `
	《《《《  Bot  Info 》》》》
	
\ 🤡𝙉𝙖𝙢𝙚: ${botName}
\ 😇𝙥𝙧𝙚𝙛𝙞𝙭 :  ${pre}
\ 💫𝙏𝙤𝙙𝙖𝙮'𝙨 𝘿𝙖𝙩𝙚: ${date}
\ 💤𝘾𝙪𝙧𝙧𝙚𝙣𝙩 𝙏𝙞𝙢𝙚: ${time}
\ 💣𝙐𝙥𝙩𝙞𝙢𝙚: ${uptimeString}
《《《《《 ༒︎ 》 》》》》》
`,
			
			attachment: await global.utils.getStreamFromURL(link)
		});
	},
	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.toLowerCase() === "info") {
			this.onStart({ message });
		}
	}
};
