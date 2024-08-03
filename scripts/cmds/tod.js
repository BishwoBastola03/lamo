const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TOD_JSON_PATH = path.join(__dirname, "tod.json");
let lang = "question"; 

module.exports = {
    config: {
        name: "tod",
        version: "1.0",
        author: "Vex_Kshitiz",
        role: 0,
        shortDescription: "play truth and dare game",
        longDescription: "play truth and dare game supports many languages",
        category: "game",
        guide: {
            en: "{p}tod [truth/dare] [lang/reset]",
        },
    },

    onStart: async function ({ api, event }) {
        const commandParts = event.body.split(' ');
        const subCommand = commandParts[1];
        const langCommand = commandParts[2];
        const userID = event.senderID;

        if (subCommand === "truth") {
            await this.sendTruth(api, event, userID);
        } else if (subCommand === "dare") {
            await this.sendDare(api, event, userID);
        } else if (subCommand === "lang") {
            if (langCommand && langCommand !== "reset") {
                if (this.isValidLanguage(langCommand)) {
                    lang = langCommand;
                    this.saveUserLang(userID, lang);
                    await api.sendMessage(`Language set to ${langCommand}`, event.threadID, event.messageID);
                } else {
                    await api.sendMessage(`Language '${langCommand}' not available.\nAvailable languages are: bn, de, es, fr, hi, tl`, event.threadID, event.messageID);
                }
            } else if (langCommand === "reset") {
                this.resetUserLang(userID);
                await api.sendMessage(`Language reset to default`, event.threadID, event.messageID);
            } else {
                await api.sendMessage("Invalid language command.\nUse 'reset' to reset to the default language\nor provide a language code\n(e.g., 'bn' for Bengali)", event.threadID, event.messageID);
            }
        } else {
            await api.sendMessage("Invalid command. ex: tod truth or tod dare\nto select language tod lang {lang}", event.threadID, event.messageID);
        }
    },

    isValidLanguage: function(lang) {
        const availableLanguages = ["bn", "de", "es", "fr", "hi", "tl"];
        return availableLanguages.includes(lang);
    },

    saveUserLang: function(userID, lang) {
        let userData = {};
        if (fs.existsSync(TOD_JSON_PATH)) {
            const data = fs.readFileSync(TOD_JSON_PATH, "utf8");
            userData = JSON.parse(data);
        }
        userData[userID] = lang;
        fs.writeFileSync(TOD_JSON_PATH, JSON.stringify(userData, null, 2));
    },

    getUserLang: function(userID) {
        if (fs.existsSync(TOD_JSON_PATH)) {
            const data = fs.readFileSync(TOD_JSON_PATH, "utf8");
            const userData = JSON.parse(data);
            return userData[userID];
        }
        return null;
    },

    resetUserLang: function(userID) {
        let userData = {};
        if (fs.existsSync(TOD_JSON_PATH)) {
            const data = fs.readFileSync(TOD_JSON_PATH, "utf8");
            userData = JSON.parse(data);
        }
        delete userData[userID];
        fs.writeFileSync(TOD_JSON_PATH, JSON.stringify(userData, null, 2));
    },

    sendTruth: async function (api, event, userID) {
        const lang = this.getUserLang(userID) || "question";
        try {
            const response = await axios.get("https://api.truthordarebot.xyz/v1/truth");
            const question = response.data.translations[lang] || response.data.question;

            await api.sendMessage(`${question}`, event.threadID, event.messageID);
        } catch (error) {
            console.error("Error fetching truth question:", error);
            await api.sendMessage("Error fetching truth question", event.threadID, event.messageID);
        }
    },

    sendDare: async function (api, event, userID) {
        const lang = this.getUserLang(userID) || "question";
        try {
            const response = await axios.get("https://api.truthordarebot.xyz/v1/dare");
            const question = response.data.translations[lang] || response.data.question;

            await api.sendMessage(`${question}`, event.threadID, event.messageID);
        } catch (error) {
            console.error("Error fetching dare question:", error);
            await api.sendMessage("Error fetching dare question", event.threadID, event.messageID);
        }
    },
};
