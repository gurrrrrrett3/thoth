import Discord from "discord.js";
const Client = new Discord.Client();
import dotenv from "dotenv";

const version = "Thoth | Ver: 2.1"

dotenv.config();

console.log("Thoth starting...");

const queue = new Map();

Client.on("ready", () => {
  console.log("Thoth Ready!"); //bot init complete
  console.log(`Logged in as ${Client.user?.tag}`);
  console.log(`Server time is ${Date.now()}`);
  console.log(`Websocket heartbeat: ${Client.ws.ping}ms.`);
});

Client.on("voiceStateUpdate", async (oldState, newState) => {
  if (
    oldState.channel == null ||
    (oldState.channel != null && newState.channel != null)
  ) {
    //deletes channel if moved out of Catacomb
    if (oldState.channel != null) {
      if (
        oldState.channel.members.size == 0 &&
        oldState.channel.name.includes("⚙")
      ) {
        oldState.channel.delete();
        console.log(`${oldState.channel.name} was deleted.`);
      }
    }
    // User Joins a voice channel

    // check for bot
    if (oldState.member?.user.bot) return;
    //check if member joined the create channel
    if (newState.channel == null) {
      return;
    } else {
      const privateChannels:string[] = ["856396096548503572"];
      const creationLocation:string = "856396009966010378";

      if (privateChannels.indexOf(newState.channel.id) != -1) {

        //Create Channel
        newState.guild.channels
          .create(`${newState.member?.user.username}'s Catacomb | ⚙`, {
            type: "voice",
            parent: creationLocation
          })
          .then((channel) => {
            channel.setParent(creationLocation);
            newState.member?.voice.setChannel(channel);
            console.log(`${newState.member?.user.username} created a Channel.`);
          });
      } else return;
    }
  } else if (newState.channel == null) {
    // User leaves a voice channel

    if (
      oldState.channel.members.size == 0 &&
      oldState.channel.name.includes("⚙")
    ) {
      oldState.channel.delete();
      console.log(`${oldState.channel.name} was deleted.`);
    }
  }

  if (newState.member?.voice.selfDeaf) {
    const afk = newState.guild.afkChannel;
    newState.member?.voice.setChannel(afk);
  }
});

//Commands

Client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return

  if (
    message.channel.id == "856373633815281694" &&
    (message.attachments.array().length > 0 || message.embeds.length > 0)
  ) {
    message.react("<:upvote:856401798524436531>").then((react) => {
      message.react("<:meh:856403134720376842>").then((react) => {
        message.react("<:downvote:856401798616580146>");
      });
    });
  }

  const parts = message.content.split(" ");

  if (parts[0] == "+") {
    //sanity checks

    if (
      message.member?.voice.channel?.name.includes(
        message.member.user.username
      ) ||
      message.author.id == "232510731067588608"
    ) {
      //user owns channel OR HACKERMAN
      if (message.mentions.users.size) {
        //user mentioned someone

        if (!message.member?.voice.channel) {
          message.channel.send(
            SendErrorEmbed(
              "You can't do that!",
              "You need to be in a voice channel first!"
            )
          );
        }

        const ownedChannel = message.member?.voice.channel;
        const mentionedUser = message.mentions.users.first();
        const mentionedMember = message.mentions.members?.first();

        if (!mentionedUser) return

        ownedChannel?.updateOverwrite(mentionedUser, {
          CONNECT: true,
          SPEAK: true,
          VIEW_CHANNEL: true,
        });

        message.channel.send(
          SendSucessEmbed(
            `You invited ${mentionedUser?.username} to your Catacomb!`,
            "They are now able to join, be sure to let them know!"
          )
        );
        console.log(
          `${mentionedMember?.user.username} was added to ${message.member?.user.username}'s Channel.`
        );
      } else {
        message.channel.send(
          SendErrorEmbed(
            "You can't do that!",
            "You need to mention a user to invite them!"
          )
        );
      }
    } else {
      message.channel.send(
        SendErrorEmbed(
          "You can't do that!",
          "You need to be the owner of this catacomb to invite someone!"
        )
      );
    }
  }

  if (parts[0] == "-") {
    //sanity checks

    if (
      message.member?.voice.channel?.name.includes(
        message.member?.user.username
      ) ||
      message.author.id == "232510731067588608"
    ) {
      //user owns channel (or ya know, HACKERMAN)
      if (message.mentions.users.size) {
        //user mentioned someone

        if (!message.member?.voice.channel) {
          message.channel.send(
            SendErrorEmbed(
              "You can't do that!",
              "You need to be in your Catacomb for that!"
            )
          );
        }

        const ownedChannel = message.member?.voice.channel;
        const mentionedUser = message.mentions.users.first();
        const mentionedMember = message.mentions.members?.first();

        if (!mentionedUser) return

        ownedChannel?.updateOverwrite(mentionedUser, {
          CONNECT: false,
          SPEAK: false,
          VIEW_CHANNEL: false,
        });
        //kick user

        if (mentionedMember?.voice.channel == ownedChannel)
          mentionedMember?.voice.setChannel(null);

        message.channel.send(
          SendErrorEmbed(
            `You removed ${mentionedUser?.username} from your Catacomb!`,
            "They are now unable to join."
          )
        );
        console.log(
          `${mentionedMember?.user.username} was removed from ${message.member?.user.username}'s Channel.`
        );
      } else {
        message.channel.send(
          SendErrorEmbed(
            "You can't do that!",
            "You need to mention a user to invite them!"
          )
        );
      }
    } else {
      message.channel.send(
        SendErrorEmbed(
          "You can't do that!",
          "You need to be the owner of this Catacomb to invite someone!"
        )
      );
    }
  }

  if (parts[0] == "++") {
    //sanity check time!
    console.log(`++|${parts[1]}|${parts[2]}|`);
    if (parts[1].length > 24) {
      message.channel.send(SendCorrectUsageEmbed("Channel Name too long!"));
      return;
    }
    if (!parts[1]) {
      message.channel.send(
        SendCorrectUsageEmbed("You need to specify a channel name!")
      );
      return;
    } else {
      if (!parts[2]) {
        message.channel.send(
          SendCorrectUsageEmbed("You need to specify a user limit!")
        );
        return;
      } else {
        if (parts[3]) {
          message.channel.send(
            SendCorrectUsageEmbed(
              "Too many arguements! Maybe you added an extra space?"
            )
          );
          return;
        }
      }
    }
    //if (Number.isInteger(parts[2]) == false){message.channel.send(SendCorrectUsageEmbed("That's not an integer! You need to specify an integer for the user limit!"));return}

    const host = message.member?.user.username;
    const channelName = `${parts[1]} | ${host} | ⚙`;
    const creationLocation = "856396009966010378";
    const userLimit = Number.parseInt(parts[2]);

    message.guild.channels
    .create(channelName, {
        type: "voice",
        parent: creationLocation,
      })
      .then((channel) => {
        channel.setParent(creationLocation);
        //@ts-ignore
        channel.updateOverwrite(message.guild.roles.everyone, {
          CONNECT: true,
          SPEAK: true,
          VIEW_CHANNEL: true,
        });
        channel.setUserLimit(userLimit);
        message.channel.send(
          SendSucessEmbed(
            "Channel Creation success!",
            `You may now join your channel!`
          )
        );
        console.log(
          `${host} Created a looking for group post for ${parts[1]} with user limit ${parts[2]}.`
        );
      });
  }

  if (parts[0] == ">help") {
    message.channel.send(SendHelpEmbed());
  }
});

function SendErrorEmbed(title:string, message:string) {
  const errorEmbed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(message)
    .setColor("#FF0000")
    .setTimestamp()
    .setFooter(version);
  return errorEmbed;
}

function SendSucessEmbed(title:string, message:string) {
  const sucessEmbed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(message)
    .setColor("#00FF00")
    .setTimestamp()
    .setFooter(version);
  return sucessEmbed;
}

function SendCorrectUsageEmbed(reason:string) {
  const CUEmbed = new Discord.MessageEmbed()
    .setTitle(
      "Incorrect usage!\n Correct usage: \n ++ (Channel Name) (Players Needed)"
    )
    .setDescription(reason)
    .setColor("#FFFF00")
    .addFields(
      {
        name: "Channel Name",
        value: "Name of the voice channel, limited to 24 characters.",
      },
      {
        name: "Players needed",
        value: "An integer value, limited at 99",
      },
      {
        name: "Example Usage",
        value:
          "++ MC_Bedwars 4 | Would create a channel named MC_Bedwars with a user limit of 4",
      }
    )
    .setTimestamp()
    .setFooter(version);
  return CUEmbed;
}

function SendHelpEmbed() {
  const HelpEmbed = new Discord.MessageEmbed()
    .setTitle("Help")
    .setDescription(
      "Use this bot to create and manage Catacombs, along with playing and downloading music!"
    )
    .setColor("#00FF00")
    .addFields(
      {
        name: "+",
        value: "Adds a user to your Catacomb.\nSyntax: `+ <Mention>`",
      },
      {
        name: "-",
        value: "Removes someone from your Catacomb.\nSyntax: `- <Mention>`",
      }
    )
    .setTimestamp()
    .setFooter(version);
  return HelpEmbed;
}

Client.login(process.env.TOKEN);
