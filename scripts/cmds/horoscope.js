const axios = require('axios');

module.exports = {
  config: {
    name: "horoscope",
    aliases: ["rashifal"],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "horoscope-rashifal",
    longDescription: "get daily horoscope based on your sunsigns.",
    category: "fun",
    guide: "{p}horoscope <sunsign | list | find>",
  },

  onStart: async function ({ event, args, message }) {
    const command = args[0];

    const nepaliSunsigns = {
      "मेष": "aries",
      "वृष": "taurus",
      "मिथुन": "gemini",
      "कर्कट": "cancer",
      "सिंह": "leo",
      "कन्या": "virgo",
      "तुला": "libra",
      "वृश्चिक": "scorpio",
      "धनु": "sagittarius",
      "मकर": "capricorn",
      "कुम्भ": "aquarius",
      "मीन": "pisces"
    };

    const englishSunsigns = {
      "aries": "Aries (March 21 – April 19)",
      "taurus": "Taurus (April 20 - May 20)",
      "gemini": "Gemini (May 21 - June 20)",
      "cancer": "Cancer (June 21 - July 22)",
      "leo": "Leo (July 23 - August 22)",
      "virgo": "Virgo (August 23 - September 22)",
      "libra": "Libra (September 23 - October 22)",
      "scorpio": "Scorpio (October 23 - November 21)",
      "sagittarius": "Sagittarius (November 22 - December 21)",
      "capricorn": "Capricorn (December 22 - January 19)",
      "aquarius": "Aquarius (January 20 - February 18)",
      "pisces": "Pisces (February – March 20)"
    };

    if (command === "list") {
      const sunsignsList = Object.keys(nepaliSunsigns).map(sign => `${sign}: ${nepaliSunsigns[sign]} (${englishSunsigns[nepaliSunsigns[sign]]})`).join("\n");
      message.reply(`List of available sunsigns:\n${sunsignsList}`);
    } else if (command === "find") {
      const name = args.slice(1).join(" ").toLowerCase();

      let sunsign = findSunsignByNepaliName(name, englishSunsigns) || findSunsignByEnglishMonth(name);

      if (!sunsign) {
        message.reply("sorry check your sunsign by\ntyping horoscope list");
        return;
      }

      if (typeof sunsign === 'object') {
        message.reply(`${sunsign.nepali || sunsign.english}.`);
      } else {
        message.reply(`${sunsign}.`);
      }
    } else {
      let sunsign = args[0];
      if (!sunsign) {
        message.reply("Please specify a sunsign or\nuse'list' to see available sunsigns.");
        return;
      }

      
      const isNepaliSunsign = Object.keys(nepaliSunsigns).includes(sunsign);

      if (isNepaliSunsign) {
       
        sunsign = nepaliSunsigns[sunsign];
      }

      try {
        const response = await axios.get(`http://sandipbgt.com/theastrologer/api/horoscope/${sunsign.toLowerCase()}/today`);
        let horoscope = response.data.horoscope.replace(/\(c\) Kelli Fox, The Astrologer, http:\/\/new\.theastrologer\.com/g, '');

        
        if (isNepaliSunsign) {
          const translatedHoroscope = await translate(horoscope, 'ne');
          horoscope = translatedHoroscope.text;
        }

        message.reply(`${horoscope}`);
      } catch (error) {
        console.error(error);
        message.reply(`an error occurred.`);
      }
    }
  }
};

async function translate(text, langCode) {
  const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);
  return {
    text: res.data[0].map(item => item[0]).join(''),
    lang: res.data[2]
  };
}

function findSunsignByNepaliName(namePrefix, englishSunsigns) {
  const prefixes = {
    "मेष": ["चु", "चे", "चो", "ला", "लि", "लु", "ले", "लो", "अ"],
    "वृष": ["इ", "उ", "ए", "ओ", "वा", "वि", "वु", "वे", "वो"],
    "मिथुन": ["का", "कि", "कु", "घ", "ङ", "छ", "के", "को", "हा"],
    "कर्कट": ["हि", "हु", "हे", "हो", "डा", "डि", "डु", "डे", "डो"],
    "सिंह": ["मा", "मि", "मु", "मे", "मो", "टा", "टि", "टु", "टे"],
    "कन्या": ["टो", "पा", "पि", "पु", "ष", "ण", "ठ", "पे", "पो"],
    "तुला": ["रा", "रि", "रु", "रे", "रो", "ता", "ति", "तु", "ते"],
    "वृश्चिक": ["तो", "ना", "नि", "नु", "ने", "नो", "या", "यि", "यु"],
    "धनु": ["ये", "यो", "भा", "भि", "भु", "धा", "फा", "ढा", "भे"],
    "मकर": ["भो", "जा", "जि", "जु", "जे", "जो", "ख", "खि", "खु", "खे", "खो", "गा", "गि"],
    "कुम्भ": ["गु", "गे", "गो", "सा", "सि", "सु", "से", "सो", "दा"],
    "मीन": ["दि", "दु", "थ", "झ", "ञ", "दे", "दो", "चा", "चि"]
  };

  for (const sunsign in prefixes) {
    if (prefixes.hasOwnProperty(sunsign)) {
      if (prefixes[sunsign].some(prefix => namePrefix.startsWith(prefix))) {
        return { nepali: sunsign, english: englishSunsigns[sunsign] };
      }
    }
  }

  return null;
}

function findSunsignByEnglishMonth(monthName) {
  const monthToSunsign = {
    "March": "aries",
    "April": "taurus",
    "May": "gemini",
    "June": "cancer",
    "July": "leo",
    "August": "virgo",
    "September": "libra",
    "October": "scorpio",
    "November": "sagittarius",
    "December": "capricorn",
    "January": "aquarius",
    "February": "pisces"
  };

  
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();

  console.log("month", formattedMonthName);

 
  if (monthToSunsign.hasOwnProperty(formattedMonthName)) {
    const sunsign = monthToSunsign[formattedMonthName];
    console.log("result", sunsign);
    return sunsign;
  } else {
    console.log("error");
    return null;
  }
}
