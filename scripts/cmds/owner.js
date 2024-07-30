const { GoatWrapper } = require('fca-liane-utils');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "owner",
		author: "Tokodori",
		role: 0,
		shortDescription: " ",
		longDescription: "",
		category: "admin",
		guide: "{pn}"
	},

	onStart: async function ({ api, event }) {
		try {
			const ownerInfo = {
				name: '𝙈𝙧-𝙋𝙚𝙧𝙛𝙚𝙘𝙩シ︎',
				gender: '𝙈𝙖𝙡𝙚',
				Hobby:'𝙁𝙪𝙣',
				Fb: 'https://www.facebook.com/profile.php?id=61556771164358',
				Relationship: '𝙔𝙚𝙩 𝙢𝙮 𝙡𝙞𝙛𝙚 𝙨𝙞𝙣𝙜𝙡𝙚 ',
				bio: '𝙒𝙚𝙡𝙡 𝙮𝙤𝙪 𝙘𝙖𝙣 𝙜𝙚𝙩 𝙡𝙖𝙯𝙯𝙞𝙣𝙚𝙨𝙨 𝙞𝙣 𝙢𝙚 '
			};

			const bold = 'https://i.imgur.com/SyBjkss.mp4';
			const tmpFolderPath = path.join(__dirname, 'tmp');

			if (!fs.existsSync(tmpFolderPath)) {
				fs.mkdirSync(tmpFolderPath);
			}

			const videoResponse = await axios.get(bold, { responseType: 'arraybuffer' });
			const videoPath = path.join(tmpFolderPath, 'owner_video.mp4');

			fs.writeFileSync(videoPath, Buffer.from(videoResponse.data, 'binary'));

			const response = `
◈ 𝖮𝖶𝖭𝖤𝖱 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭:\n
𝙉𝙖𝙢𝙚: ${ownerInfo.name}
𝙂𝙚𝙣𝙙𝙚𝙧: ${ownerInfo.gender}
𝙍𝙚𝙡𝙚𝙖𝙩𝙞𝙤𝙣𝙨𝙝𝙞𝙥: ${ownerInfo.Relationship}
𝙃𝙤𝙗𝙗𝙮: ${ownerInfo.hobby}
𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠: ${ownerInfo.Fb}
𝘽𝙞𝙤: ${ownerInfo.bio}
			`;

			await api.sendMessage({
				body: response,
				attachment: fs.createReadStream(videoPath)
			}, event.threadID, event.messageID);

			fs.unlinkSync(videoPath);

			api.setMessageReaction('🤞', event.messageID, (err) => {}, true);
		} catch (error) {
			console.error('Error in ownerinfo command:', error);
			return api.sendMessage('An error occurred while processing the command.', event.threadID);
		}
	}
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });