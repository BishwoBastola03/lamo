
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "1.0",
    author: "Loid , Mr-perfect",
    countDown: 8,
    role: 2,
    shortDescription: "accept users",
    longDescription: "accept users",
    category: "Utility",
    nonPrefix: true,
  },

  onChat: async function ({ event, api, commandName }) {
    if (event.body.toLowerCase() === "fbrequests" ||
        event.body.toLowerCase() === "acp" || 
        event.body.toLowerCase() === "accept") {

      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } }),
      };
      const listRequest = JSON.parse(
        await api.httpPost("https://www.facebook.com/api/graphql/", form)
      ).data.viewer.friending_possibilities.edges;
      let msg = "";
      let i = 0;
      for (const user of listRequest) {
        i++;
        msg += `------------------\n${i}. Name: ${user.node.name}`
          + `\nUID: ${user.node.id}`
          + `\n To visit : ${user.node.url.replace(
            "www.facebook",
            "fb"
          )}`
          + `\n Time: ${moment(user.time * 1009)
            .tz("Asia/kathmandu")
            .format("DD/MM/YYYY HH:mm:ss")}\n`;
      }
      api.sendMessage(
        `${msg}\nReply to this message with content: <add | del> <comparison | or "all"> to take action`,
        event.threadID,
        (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            listRequest,
            author: event.senderID,
            unsendTimeout: setTimeout(() => {
              api.unsendMessage(info.messageID); // Unsend the message after the countdown duration
            }, this.config.countDown * 20000), // Convert countdown duration to milliseconds
          });
        },
        event.messageID
      );
    }
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");

    clearTimeout(Reply.unsendTimeout); // Clear the timeout if the user responds within the countdown duration

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString(),
        },
        scale: 3,
        refresh_num: 0,
      },
    };

    // Check if the user wants to add or delete
    let action = args[0];
    let targetIDs = args.slice(1);

    // If the user didn't specify add or del, assume they want to add
    if (action !== "add" && action !== "del") {
      action = "add";
    }

    if (action === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else if (action === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }

    // Handle "all" or specific numbers
    if (targetIDs[0] === "all") {
      targetIDs = [];
      const lengthList = listRequest.length;
      for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
    }

    const newTargetIDs = [];
    const promiseFriends = [];
    const success = [];
    const failed = [];

    for (const stt of targetIDs) {
      const u = listRequest[parseInt(stt) - 1];
      if (!u) {
        failed.push(`Can't find stt ${stt} in the list`);
        continue;
      }
      form.variables.input.friend_requester_id = u.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(u);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const lengthTarget = newTargetIDs.length;
    for (let i = 0; i < lengthTarget; i++) {
      try {
        const friendRequest = await promiseFriends[i];
        if (JSON.parse(friendRequest).errors) {
          failed.push(newTargetIDs[i].node.name);
        } else {
          success.push(newTargetIDs[i].node.name);
        }
      } catch (e) {
        failed.push(newTargetIDs[i].node.name);
      }
    }

    if (success.length > 0) {
      api.sendMessage(
        `» The ${
          action === "add" ? "friend request" : "friend request deletion"
        } has been processed for ${success.length} people:\n\n${success.join(
          "\n"
        )}${
          failed.length > 0
            ? `\n» The following ${failed.length} people encountered errors: ${failed.join(
                "\n"
              )}`
            : ""
        }`,
        event.threadID,
        event.messageID
      );
    } else {
      api.unsendMessage(messageID); // Unsend the message if the response is incorrect
      return api.sendMessage(
        "Invalid response. Please provide a valid response.",
        event.threadID
      );
    }

    api.unsendMessage(messageID); // Unsend the message after it has been processed
  },

  // Placeholder onStart function
  onStart: async function ({ event, api, commandName }) {
    // Do nothing here, as onChat will handle the command execution.
  },
};


