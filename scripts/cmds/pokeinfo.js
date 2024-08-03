const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pokeinfo",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "",
    longDescription: "Get information about a Pokémon.",
    category: "fun",
    guide: "{p}pokeinfo {name}",
  },

  onStart: async function ({ api, event, args, message }) {
    async function checkAuthor(authorName) {
      try {
        const response = await axios.get('https://author-check.vercel.app/name');
        const apiAuthor = response.data.name;
        return apiAuthor === authorName;
      } catch (error) {
        console.error("Error checking author:", error);
        return false;
      }
    }

    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      await message.reply("Author changer alert! This command belongs to Vex_Kshitiz.");
      return;
    }

    const pokemonName = args.join(" ");
    const pokeApiUrl = `https://poke-info-blush.vercel.app/kshitiz?name=${encodeURIComponent(pokemonName)}`;

    try {
      const response = await axios.get(pokeApiUrl);
      const {
        name,
        image,
        type,
        species,
        height,
        weight,
        abilities,
        eggGroups,
        genderRatio,
        evYield,
        catchRate,
        baseFriendship,
        baseExp,
        growthRate,
        eggCycles
      } = response.data;

      const infoText = `
        Name: ${name}
        Type: ${type}
        Species: ${species}
        Height: ${height}
        Weight: ${weight}
        Abilities: ${abilities.join(", ")}
        Egg Groups: ${eggGroups.join(", ")}
        Gender Ratio: ${genderRatio}
        EV Yield: ${evYield}
        Catch Rate: ${catchRate}
        Base Friendship: ${baseFriendship}
        Base Exp: ${baseExp}
        Growth Rate: ${growthRate}
        Egg Cycles: ${eggCycles}
      `;

      const tempImagePath = path.join(__dirname, "cache", `${Date.now()}_${name}.jpg`);

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tempImagePath);
        writer.on("finish", resolve);
        writer.on("error", reject);
        axios.get(image, { responseType: "stream" }).then(imageResponse => {
          imageResponse.data.pipe(writer);
        }).catch(reject);
      });

      const stream = fs.createReadStream(tempImagePath);
      message.reply({
        body: infoText,
        attachment: stream,
      }, (err) => {
        if (err) console.error(err);
        fs.unlink(tempImagePath, (err) => {
          if (err) console.error(`Error deleting temp file: ${err}`);
        });
      });

    } catch (error) {
      console.error(error);
      message.reply("Sorry, an error occurred while processing your request.");
    }
  }
};
