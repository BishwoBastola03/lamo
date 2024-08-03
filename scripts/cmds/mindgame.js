module.exports = {
    config: {
        name: "mindgame",
        aliases: ["mgm"],
        version: "1.0",
        author: "Vex_Kshitiz",
        shortDescription: {
            en: "Play the mind game with frnd!"
        },
        longDescription: {
            en: "mind game. vs with frnd "
        },
        category: "game",
        guide: {
            en: "Reply the box of hidden emojis to reveal them (e.g., A1 B2)."
        }
    },

    onStart: async function ({ event, message, usersData, api }) {
        const mention = Object.keys(event.mentions);
        if (mention.length === 0) {
            return message.reply("Please mention one player to start the game.");
        }

        const player1ID = mention[0];
        const player2ID = event.senderID;
        const players = [player1ID, player2ID];

        const player1Info = await api.getUserInfo(player1ID);
        const player2Info = await api.getUserInfo(player2ID);

        const player1Name = player1Info[player1ID].name;
        const player2Name = player2Info[player2ID].name;

        global.memoryGame = {
            players: players,
            currentPlayerIndex: Math.round(Math.random()), 
            board: generateBoard(),
            revealed: Array.from({ length: 4 }, () => Array(4).fill("🔳")),
            emojis: generateEmojis(),
            matches: Array(2).fill(0), 
            currentMessageID: null
        };

        const gameBoard = generateVisibleBoard();
        const sentMessage = await message.reply(gameBoard);
        global.memoryGame.currentMessageID = sentMessage.messageID;

        const firstPlayerName = global.memoryGame.players[global.memoryGame.currentPlayerIndex] === player1ID ? player1Name : player2Name;
        const secondPlayerName = global.memoryGame.players[global.memoryGame.currentPlayerIndex] === player1ID ? player2Name : player1Name;
        message.reply(`It's ${firstPlayerName}'s turn now.`);

        global.memoryGame.currentPlayerName = firstPlayerName;
        global.memoryGame.opponentName = secondPlayerName;
    },

    onChat: async function ({ event, message, api }) {
        if (!global.memoryGame) return;

        const playerIndex = global.memoryGame.currentPlayerIndex;
        const currentPlayer = global.memoryGame.players[playerIndex];
        const opponentIndex = (playerIndex + 1) % 2;

        const currentPlayerInfo = await api.getUserInfo(currentPlayer);
        const opponentInfo = await api.getUserInfo(global.memoryGame.players[opponentIndex]);

        const currentPlayerName = currentPlayerInfo[currentPlayer].name;
        const opponentName = opponentInfo[global.memoryGame.players[opponentIndex]].name;

        if (event.senderID !== currentPlayer) return;

        const input = event.body.trim().toUpperCase().split(" ");
        if (input.length !== 2 || !isValidInput(input[0]) || !isValidInput(input[1])) {
            return;
        }

        const [row1, col1] = getPosition(input[0]);
        const [row2, col2] = getPosition(input[1]);

        if (global.memoryGame.revealed[row1][col1] !== "🔳" || global.memoryGame.revealed[row2][col2] !== "🔳") {
            return;
        }

        revealEmoji(row1, col1);
        revealEmoji(row2, col2);

        const [emoji1, emoji2] = [global.memoryGame.emojis[row1 * 4 + col1], global.memoryGame.emojis[row2 * 4 + col2]];

        if (emoji1 === emoji2) {
            global.memoryGame.matches[playerIndex]++;
            global.memoryGame.currentPlayerIndex = playerIndex; 
        } else {
            setTimeout(async () => {
                hideEmoji(row1, col1);
                hideEmoji(row2, col2);
                const gameBoard = generateVisibleBoard();
                const sentMessage = await message.reply(gameBoard);
                try {
                    message.unsend(global.memoryGame.currentMessageID);
                } catch (error) {
                    console.error("Error while unsending message:", error);
                }
                global.memoryGame.currentPlayerIndex = opponentIndex;
                global.memoryGame.currentPlayerName = opponentName;
                global.memoryGame.opponentName = currentPlayerName;
                message.reply(`It's ${opponentName}'s turn now.`);
            }, 2000);
        }

        const gameBoard = generateVisibleBoard();
        const sentMessage = await message.reply(gameBoard);
        global.memoryGame.currentMessageID = sentMessage.messageID;

        if (global.memoryGame.matches[0] + global.memoryGame.matches[1] === 8) {
            const winnerIndex = global.memoryGame.matches[0] > global.memoryGame.matches[1] ? 0 : 1;
            const winner = global.memoryGame.players[winnerIndex];
            const winnerName = winner === currentPlayer ? currentPlayerName : opponentName;
            message.reply(`Congratulations! ${winnerName} wins with ${global.memoryGame.matches[winnerIndex]} points!`);
            delete global.memoryGame;
        }
    }
};

function generateEmojis() {
    const emojis = ["🐼", "🐉", "🐐", "🤡", "🧠", "👽", "🕷", "🐧"];
    return emojis.concat(emojis).sort(() => Math.random() - 0.5); 
}

function generateVisibleBoard() {
    let board = "";
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            board += `${global.memoryGame.revealed[i][j]} `;
        }
        board += "\n";
    }
    return board.trim();
}

function generateBoard() {
    return Array.from({ length: 4 }, () => Array(4).fill("🔳"));
}

function isValidInput(input) {
    return input.length === 2 && input[0] >= "A" && input[0] <= "D" && input[1] >= "1" && input[1] <= "4";
}

function getPosition(input) {
    const row = input.charCodeAt(0) - 65;
    const col = parseInt(input[1]) - 1; 
    return [row, col];
}

function revealEmoji(row, col) {
    global.memoryGame.revealed[row][col] = global.memoryGame.emojis[row * 4 + col];
}

function hideEmoji(row, col) {
    global.memoryGame.revealed[row][col] = "🔳";
}
