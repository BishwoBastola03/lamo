const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
  config: {
    name: 'shell',
    aliases: ['$','>'],
    version: '1.0',
    author: 'annyomus',
    role: 2,
    category: 'utility',
    shortDescription: {
      en: 'Executes terminal commands.',
    },
    longDescription: {
      en: 'Executes terminal commands and returns the output.',
    },
    guide: {
      en: '{pn} [command]',
    },
  },
  onStart: async function ({ api, args, message, event }) {
    if (args.length === 0) {
      message.reply('Usage: {pn} [command]');
      return;
    }

    const lado = args.join(' ');

    try {
      const { stdout, stderr } = await exec(lado);

      if (stderr) {
        message.send(`${stderr}`);
      } else {
        message.send(`${stdout}`);
      }
    } catch (error) {
      console.error(error);
      message.reply(`Error: ${error.message}`);
    }
  },
};