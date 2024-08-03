const fetch = require('node-fetch');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const cacheDirectory = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "nc",
    aliases: ["nepcalender", "nepalicalender", "calender"],
    version: "1.0",
    author: "Kshitiz",
    role: 0,
    shortDescription: "calender",
    longDescription: "Nepali calender.",
    category: "Utility",
    guide: {
      en: "{p}nc"
    }
  },

  onStart: async function ({ api, event }) {
    try {

      const response = await fetch('https://calendar.bloggernepal.com/api/today');
      const data = await response.json();


      const canvas = createCanvas(540, 460);
      const ctx = canvas.getContext('2d');


      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);


      drawCalendar(ctx, canvas, data);

      const imageBuffer = canvas.toBuffer();
      const imagePath = path.join(cacheDirectory, 'nepali_calendar.png');
      await fs.promises.mkdir(cacheDirectory, { recursive: true });
      await fs.promises.writeFile(imagePath, imageBuffer);


      api.sendMessage({ attachment: fs.createReadStream(imagePath) }, event.threadID, event.messageID);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
};

function drawCalendar(ctx, canvas, data) {

  ctx.font = '20px Arial'; 


  const cellWidth = 65; 
  const cellHeight = 65; 
  const startX = 40;
  const startY = 55;

  const nameYearY = 20;


  ctx.fillStyle = 'lime'; 

  ctx.shadowColor = 'black';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;


  const nameYearText = `${nepaliToRoman(data.res.name)} / ${nepaliToArabic(data.res.year)}`;
  ctx.fillText(nameYearText, startX, nameYearY);


  const engMonthYearText = `${data.res.eng2} / ${data.res.engYear}`;
  ctx.fillText(engMonthYearText, startX + 325, nameYearY);


  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;


  ctx.fillStyle = 'black'; 
  ctx.font = '20px Arial'; 
  ctx.textAlign = 'center';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < days.length; i++) {
    ctx.fillText(days[i], startX + (i * cellWidth) + (cellWidth / 2), startY - 10);
  }


  const totalDays = data.res.days.length;
  let row = 0;
  let col = 0;
  const drawnDates = [];
  const preDates = [];
  for (let i = 0; i < totalDays; i++) {
    const day = data.res.days[i];
    const x = startX + (col * cellWidth);
    const y = startY + (row * cellHeight);


    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellWidth, cellHeight);


    const isPreTag = day.tag === "pre";


    if (isPreTag) {
      preDates.push(day.bs);
      ctx.globalAlpha = 0.5; 
    } else if (preDates.includes(day.bs)) {

      ctx.globalAlpha = 1; 
    } else if (drawnDates.includes(day.bs)) {
      ctx.globalAlpha = 0.5; 
    } else {
      ctx.globalAlpha = 1;
    }


    ctx.fillStyle = day.tag === "today" ? 'red' : 'white';
    ctx.fillRect(x, y, cellWidth, cellHeight);
    ctx.fillStyle = 'black';
    const bs = nepaliToArabic(day.bs);
    ctx.fillText(bs, x + 20, y + 40); 
    ctx.font = '12px Arial';
    ctx.fillText(day.ad, x + cellWidth - 35, y + 20);
    ctx.font = '20px Arial'; 


    if (day.tag === "today") {
      ctx.font = '10px Arial'; 
      ctx.fillStyle = 'black';
      ctx.fillText("Today", x + 25, y + cellHeight - 5); 
      ctx.font = '20px Arial'; 
    }


    ctx.globalAlpha = 1;


    if (!drawnDates.includes(day.bs)) {
      drawnDates.push(day.bs);
    }

    col++;
    if (col === 7) {
      col = 0;
      row++;
    }
  }
}

function nepaliToArabic(nepaliNumeral) {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  const arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let arabicNumeral = '';
  for (let i = 0; i < nepaliNumeral.length; i++) {
    const index = nepaliDigits.indexOf(nepaliNumeral[i]);
    if (index !== -1) {
      arabicNumeral += arabicDigits[index];
    } else {
      arabicNumeral += nepaliNumeral[i];
    }
  }

  return arabicNumeral;
}

function nepaliToRoman(nepaliName) {

  const nepaliMonthMap = {
    "बैशाख": "Baisakh",
    "जेठ": "Jestha",
    "असार": "Ashadh",
    "श्रावण": "Shrawan",
    "भाद्र": "Bhadra",
    "आश्विन": "Ashwin",
    "कार्तिक": "Kartik",
    "मंसिर": "Mangsir",
    "पौष": "Poush",
    "माघ": "Magh",
    "फाल्गुण": "Falgun",
    "चैत": "Chaitra"
  };


  return nepaliMonthMap[nepaliName] || nepaliName;
}
