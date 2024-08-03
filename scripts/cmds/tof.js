const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const userDataFilePath = path.join(__dirname, 'users.json');

module.exports = {
  config: {
    name: "tof",
    aliases: [],
    version: "1.0",
    author: "Kshitiz",
    role: 0,
    shortDescription: "Play true or false quiz",
    longDescription: "Play a true or false quiz game",
    category: "fun",
    guide: {
      en: "{p}tof"
    }
  },

  onStart: async function ({ event, message, usersData, api }) {
    const quizData = await fetchQuiz();
    if (!quizData) {
      return message.reply("Failed to fetch quiz question. Please try again later.");
    }

    const { question, correct_answer, incorrect_answers } = quizData;
    const correctAnswerLetter = correct_answer.split(',')[0].trim().toUpperCase();
    const incorrectAnswerLetter = incorrect_answers.split('[')[0].trim().toUpperCase();

    let optionsString = '';
    if (correctAnswerLetter === 'A') {
      optionsString += `A. True\nB. False`;
    } else {
      optionsString += `A. False\nB. True`;
    }

    const sentQuestion = await message.reply(`Question: ${question}\nOptions:\n${optionsString}`);

    global.GoatBot.onReply.set(sentQuestion.messageID, {
      commandName: this.config.name,
      messageID: sentQuestion.messageID,
      correctAnswerLetter: correctAnswerLetter
    });

    setTimeout(async () => {
      try {
        await message.unsend(sentQuestion.messageID);
      } catch (error) {
        console.error("Error while unsending question:", error);
      }
    }, 20000);
  },

  onReply: async function ({ message, event, Reply }) {
    const userAnswer = event.body.trim().toUpperCase();
    const correctAnswerLetter = Reply.correctAnswerLetter;

    if (userAnswer === correctAnswerLetter) {
      const userID = event.senderID;
      await addCoins(userID, 1000);
      await message.reply("🎉🎊 Congratulations! Your answer is correct. You have received 1000 coins.");
    } else {
      await message.reply(`🥺 Oops! Wrong answer. The correct answer was: ${correctAnswerLetter}`);
    }

    try {
      await message.unsend(event.messageID);
    } catch (error) {
      console.error("Error while unsending message:", error);
    }

    const { commandName, messageID } = Reply;
    if (commandName === this.config.name) {
      try {
        await message.unsend(messageID);
      } catch (error) {
        console.error("Error while unsending question:", error);
      }
    }
  }
};

async function fetchQuiz() {
  try {
    const response = await axios.get('https://trueorfalse.onrender.com/kshitiz');
    return response.data;
  } catch (error) {
    console.error("Error fetching quiz question:", error);
    return null;
  }
}

async function addCoins(userID, amount) {
  let userData = await getUserData(userID);
  if (!userData) {
    userData = { money: 0 };
  }
  userData.money += amount;
  await saveUserData(userID, userData);
}

async function getUserData(userID) {
  try {
    const data = await fs.readFile(userDataFilePath, 'utf8');
    const userData = JSON.parse(data);
    return userData[userID];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(userDataFilePath, '{}');
      return null;
    } else {
      console.error("Error reading user data:", error);
      return null;
    }
  }
}

async function saveUserData(userID, data) {
  try {
    const userData = await getUserData(userID) || {};
    const newData = { ...userData, ...data };
    const allUserData = await getAllUserData();
    allUserData[userID] = newData;
    await fs.writeFile(userDataFilePath, JSON.stringify(allUserData, null, 2), 'utf8');
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

async function getAllUserData() {
  try {
    const data = await fs.readFile(userDataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading user data:", error);
    return {};
  }
}
