const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
const waifuDataFile = path.join(__dirname, "pokemon.json");
const waifuStateFile = path.join(__dirname, "pokestate.json");

module.exports = {
    threadStates: {},
    intervalID: null,
    config: {
        name: "pokedex",
        version: "2.0",
        author: "Vex_kshitiz",
        role: 0,
        shortDescription: "Guess the pokemon!",
        longDescription: "Guess the pokemon! and add it into your pokemon collection",
        category: "game",
        guide: {
            en: "{p}pokedex",
        },
    },

    onStart: async function ({ api, event }) {
        const threadID = event.threadID;

        let waifuStates = this.loadWaifuStates();

        if (!waifuStates[threadID]) {
            waifuStates[threadID] = { status: "off", repliedUsers: [] };
            this.saveWaifuStates(waifuStates);
        }

        const subCommand = event.body.split(' ')[1];
        if (subCommand === 'top') {
            await this.sendTopWaifuUsers(api, event);
            return;
        } else if (subCommand === 'list') {
            await this.sendWaifuList(api, event);
            return;
        }

        if (event.body.toLowerCase().includes("pokedex on")) {
            waifuStates[threadID].status = "on";
            this.saveWaifuStates(waifuStates);
            api.sendMessage("pokedex is now turned on.", event.threadID, event.messageID);

            if (!this.intervalID) {
                this.setRandomInterval(api, threadID);
            }
        } else if (event.body.toLowerCase().includes("pokedex off")) {
            waifuStates[threadID].status = "off";
            this.saveWaifuStates(waifuStates);
            api.sendMessage("pokedex is now turned off.", event.threadID, event.messageID);

            clearInterval(this.intervalID);
            this.intervalID = null;
        }
    },


    setRandomInterval: async function (api, threadID) {
        const getRandomInterval = () => {
            const intervals = [5, 10, 15]; 
            const randomIndex = Math.floor(Math.random() * intervals.length);
            return intervals[randomIndex];
        };

        const sendWaifuImage = async () => {
            await this.sendWaifu(api, threadID);
            this.setRandomInterval(api, threadID); 
        };

        const randomInterval = getRandomInterval() * 60000;
        this.intervalID = setTimeout(sendWaifuImage, randomInterval);
    },

    sendWaifu: async function (api, threadID) {
        const waifuStates = this.loadWaifuStates();

        if (waifuStates[threadID].status === "on") {
            const characterData = await this.fetchCharacterData();
            if (!characterData || !characterData.image) {
                console.error("Error fetching  data");
                return;
            }

            const { image, traits, tags, fullName, firstName } = characterData;

            try {
                const imagePath = path.join(cacheDir, "pokemon_image.jpg");
                const writer = fs.createWriteStream(imagePath);
                const response = await axios.get(image, { responseType: "stream" });
                response.data.pipe(writer);

                writer.on("finish", async () => {
                    const waifuBody = `Random pokemon appeared\nGuess the name!!`;

                    const replyMessage = { body: waifuBody, attachment: fs.createReadStream(imagePath) };
                    const sentMessage = await api.sendMessage(replyMessage, threadID);

                    global.GoatBot.onReply.set(sentMessage.messageID, {
                        commandName: this.config.name,
                        messageID: sentMessage.messageID,
                        correctAnswer: [fullName, firstName],
                        repliedUsers: [], 
                    });

                    setTimeout(async () => {
                        await api.unsendMessage(sentMessage.messageID);
                    }, 40000); 
                });
            } catch (error) {
                console.error("Error downloading and sending image:", error);
            }
        }
    },

    onReply: async function ({ api, event, Reply }) {
        try {
            if (!event || !Reply) return;
            const userAnswer = event.body.trim().toLowerCase();
            const correctAnswers = Reply.correctAnswer.map(name => name.toLowerCase());
            const repliedUsers = Reply.repliedUsers || [];

            if (repliedUsers.includes(event.senderID)) {
                await api.sendMessage("Try again", event.threadID);
                return;
            }

            if (correctAnswers.includes(userAnswer)) {
                repliedUsers.push(event.senderID); 
                Reply.repliedUsers = repliedUsers; 
                global.GoatBot.onReply.set(Reply.messageID, Reply); 

                await this.addWaifu(event.senderID, Reply.correctAnswer[0]);

                await api.sendMessage("Correct answer! pokemon is added to your collection.", event.threadID, event.messageID);

                const waifuMessageID = Reply.messageID;
                await api.unsendMessage(waifuMessageID);
                await api.unsendMessage(event.messageID);
            } else {
                await api.sendMessage(`Oops! Wrong answer.\nKeep trying!`, event.threadID, event.messageID);
            }
        } catch (error) {
            console.error("Error while handling user reply:", error);
        }
    },

    fetchCharacterData: async function () {
        try {
            const response = await axios.get("https://pokedex-gamma-red.vercel.app/kshitiz");
            return response.data;
        } catch (error) {
            console.error("Error in API", error);
            return null;
        }
    },

    loadWaifuStates: function () {
        try {
            const data = fs.readFileSync(waifuStateFile, "utf8");
            return JSON.parse(data);
        } catch (err) {
            return {};
        }
    },

    saveWaifuStates: function (states) {
        fs.writeFileSync(waifuStateFile, JSON.stringify(states, null, 2));
    },

    addWaifu: async function (userID, waifuName) {
        try {
            let userWaifus = await this.getUserWaifus(userID);
            if (!userWaifus) {
                userWaifus = [];
            }

            const existingIndex = userWaifus.findIndex(name => name.toLowerCase() === waifuName.toLowerCase());
            if (existingIndex !== -1) {
                userWaifus[existingIndex] = waifuName;
            } else {
                userWaifus.push(waifuName);
            }

            await this.setUserWaifus(userID, userWaifus);
        } catch (error) {
            console.error("Error adding .", error);
        }
    },

    getUserWaifus: async function (userID) {
        try {
            const data = await fs.promises.readFile(waifuDataFile, "utf8");
            const userWaifus = JSON.parse(data)[userID];
            return userWaifus;
        } catch (error) {
            if (error.code === "ENOENT") {
                await fs.promises.writeFile(waifuDataFile, "{}");
                return null;
            } else {
                console.error("Error reading waifus:", error);
                return null;
            }
        }
    },

    setUserWaifus: async function (userID, waifus) {
        try {
            const waifuData = await this.getWaifuData();
            waifuData[userID] = waifus;
            await fs.promises.writeFile(
                waifuDataFile,
                JSON.stringify(waifuData, null, 2),
                "utf8"
            );
        } catch (error) {
            console.error("Error setting pokemon:", error);
        }
    },

    getWaifuData: async function () {
        try {
            const data = await fs.promises.readFile(waifuDataFile, "utf8");
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading pokemon data:", error);
            return {};
        }
    },

    sendWaifuList: async function (api, event) {
        const userID = event.senderID;
        const userWaifus = await this.getUserWaifus(userID);
        if (!userWaifus || userWaifus.length === 0) {
            await api.sendMessage("Your pokemon collection is empty.", event.threadID, event.messageID);
            return;
        }

        let waifusText = "List of your pokemon:\n";
        userWaifus.forEach((waifu, index) => {
            waifusText += `${index + 1}. ${waifu}\n`;
        });

        await api.sendMessage(waifusText, event.threadID, event.messageID);
    },

    sendTopWaifuUsers: async function (api, event) {
        const waifuData = await this.getWaifuData();
        const usersWithWaifus = Object.entries(waifuData).map(([userID, waifus]) => ({
            userID,
            waifuCount: waifus.length,
        }));

        const topUsers = usersWithWaifus.sort((a, b) => b.waifuCount - a.waifuCount).slice(0, 5);
        let topUsersText = "pokemon collection ranking:\n";

        for (const user of topUsers) {
            const username = await this.getUserName(user.userID, api);
            if (username) {
                topUsersText += `${username} - ${user.waifuCount} pokemon\n`;
            }
        }

        await api.sendMessage(topUsersText, event.threadID, event.messageID);
    },

    getUserName: async function (userID, api) {
        try {
            const userInfo = await api.getUserInfo(userID);
            const username = userInfo[userID].name;
            return username;
        } catch (error) {
            console.error("Error getting username:", error);
            return null;
        }
    },
};
