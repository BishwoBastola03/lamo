const axios = require("axios");
module.exports = {
    config: {
        name: "niji",
        aliases: ["nijijourney", "art"],
        version: "1.0",
        author: "rehat--",
        countDown: 0,
        role: 0,
        longDescription: "Text to Image",
        category: "ai",
        guide: {
    en: `{pn} <prompt> --ar [ratio], [preset], [style], or reply to an image\n\nAvailable Styles:\n1. Cinematic\n2. Photographic\n3. Anime\n4. Manga\n5. Digital Art\n6. Pixel Art\n7. Fantasy Art\n8. Neon Punk\n9. 3D Model\n\nAvailable Presets:\n1. Standard v3.0\n2. Standard v3.1\n3. Light v3.1\n4. Heavy v3.1`,
      }
    },

    onStart: async function({ api, args, message, event }) {
        try {
            let prompt = "";
            let style = "";
            let imageUrl = "";
            let preset = "";
            let aspectRatio = ""; 

            const styleIndex = args.indexOf("--style");
            if (styleIndex !== -1 && args.length > styleIndex + 1) {
                style = args[styleIndex + 1];
                args.splice(styleIndex, 2); 
            }

            const presetIndex = args.indexOf("--preset");
            if (presetIndex !== -1 && args.length > presetIndex + 1) {
                preset = args[presetIndex + 1];
                args.splice(presetIndex, 2); 
            }
            
            const aspectIndex = args.indexOf("--ar");
            if (aspectIndex !== -1 && args.length > aspectIndex + 1) {
                aspectRatio = args[aspectIndex + 1];
                args.splice(aspectIndex, 2); 
            }

            if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0 && ["photo", "sticker"].includes(event.messageReply.attachments[0].type)) {
                imageUrl = encodeURIComponent(event.messageReply.attachments[0].url);
            } else if (args.length === 0) {
                message.reply("Please provide a prompt or reply to an image.");
                return;
            }
            
            if (args.length > 0) {
                prompt = args.join(" ");
            }

            
            let apiUrl = `https://rehatdesu.xyz/api/imagine/niji?prompt=${encodeURIComponent(prompt)}.&aspectRatio=${aspectRatio}&style=${style}&preset=${preset}&apikey=gaysex`;
            if (imageUrl) {
                apiUrl += `&imageUrl=${imageUrl}`;
            }

            const processingMessage = await message.reply("Please wait...⏳");
            const response = await axios.post(apiUrl);
            const img = response.data.url;

            await message.reply({
                attachment: await global.utils.getStreamFromURL(img)
            });

        } catch (error) {
            console.error(error);
            message.reply("An error occurred.");
        }
    }
};
