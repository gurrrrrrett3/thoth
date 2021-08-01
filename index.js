const Discord = require("discord.js");
const Client = new Discord.Client();
const dotenv = require("dotenv");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const fs = require("fs")

const version = "Thoth | Ver: 1.5"

dotenv.config();

console.log("Thoth starting...");

const queue = new Map();

Client.on("ready", () => {
  console.log("Thoth Ready!"); //bot init complete
  console.log(`Logged in as ${Client.user.tag}`);
  console.log(`Server time is ${Date.now()}`);
  console.log(`Websocket heartbeat: ${Client.ws.ping}ms.`);
});

Client.on("voiceStateUpdate", (oldState, newState) => {
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
    if (oldState.member.user.bot) return;
    //check if member joined the create channel
    if (newState.channel == null) {
      return;
    } else {
      const privateChannels = ["856396096548503572"];
      const creationLocation = "856396009966010378";

      if (privateChannels.includes(newState.channel.id)) {
        //Create Channel
        newState.guild.channels
          .create(`${newState.member.user.username}'s Catacomb | ⚙`, {
            type: "voice",
            parent_id: creationLocation,
          })
          .then((channel) => {
            channel.setParent(creationLocation);
            newState.member.voice.setChannel(channel);
            console.log(`${newState.member.user.username} created a Channel.`);
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

  if (newState.member.voice.selfDeaf) {
    const afk = newState.guild.afkChannel;
    newState.member.voice.setChannel(afk);
  }
});

//Commands

Client.on("message", async (message) => {
  if (message.author.bot) return;

  if (
    message.channel.name == "memes" &&
    (message.attachments.array().length > 0 || message.embeds.length > 0)
  ) {
    message.react("<:upvote:856401798524436531>").then((react) => {
      message.react("<:meh:856403134720376842>").then((react) => {
        message.react("<:downvote:856401798616580146>");
      });
    });
  }

  const parts = message.content.split(" ");

  if (parts[0].startsWith(">")) {
    //music bot commands

    const command = parts[0].slice(1);

    const vc = message.member.voice.channel;

    if (!vc)
      return message.channel.send(
        SendErrorEmbed(
          "You can't do that!",
          "You need to be in a voice channel to use this command!"
        )
      );
    const perm = vc.permissionsFor(message.client.user);

    if (!perm.has("SPEAK"))
      return message.channel.send(
        SendErrorEmbed(
          "You can't do that!",
          "You don't have the correct permissions!"
        )
      );

    const guildQueue = queue.get(message.guild.id);

    if (command == "p") {
      if (!parts[1])
        return message.channel.send(
          SendErrorEmbed("Oops!", "You need something to play!")
        );

      var song = {};

      if (ytdl.validateURL(parts[1])) {
        const songInfo = await ytdl.getInfo(parts[1]);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          length: songInfo.videoDetails.lengthSeconds
            .toString()
            .match(/\(.+\)/g)
            .toString()
            .replace(/[()]+/g, ""),
        };
      } else {
        const video = await findVideo(parts.slice(1).join(" "));
        if (video) {
          song = {
            title: video.title,
            url: video.url,
            length: video.duration
              .toString()
              .match(/\(.+\)/g)
              .toString()
              .replace(/[()]+/g, ""),
          };
        } else {
          message.channel.send(SendErrorEmbed("Oops!", "Error finding Video."));
        }
      }
      if (!guildQueue) {
        const guildQueueObject = {
          voice_channel: vc,
          text_channel: message.channel,
          connection: null,
          songs: [],
        };

        queue.set(message.guild.id, guildQueueObject);
        guildQueueObject.songs.push(song);

        try {
          const connection = await vc.join();
          guildQueueObject.connection = connection;
          await playVideo(message.guild, guildQueueObject.songs[0]);
        } catch (err) {
          queue.delete(message.guild.id);
          message.channel.send(SendErrorEmbed("Error:", `\`\`\`${err}\`\`\``));
          throw err;
        }
      } else {
        guildQueue.songs.push(song);
        return message.channel.send(
          SendSucessEmbed(":headphones:", `**${song.title} added to queue!**`)
        );
      }
    } else if (command == "skip") {
      skipSong(message, guildQueue);
    } else if (command == "stop") {
      stopSong(message, guildQueue);
    } else if (command == "q") {
      var queueEmbed = new Discord.MessageEmbed();
      var queuePage = "```yaml\n";
      guildQueue.songs.forEach((song, index) => {
        queuePage += `${index + 1} | ${song.title} | ${song.length}\n`;
      });
      queuePage += "```";

      queueEmbed.setTitle(`Queue for ${message.guild.name}:`);
      queueEmbed.setDescription(queuePage);
      queueEmbed.setTimestamp();
      queueEmbed.setColor(message.member.displayHexColor);
      queueEmbed.setFooter(version);

      message.channel.send(queueEmbed);
    }
  } 

  if (parts[0] == "-3") {
    if (!parts[1])
        return message.channel.send(
          SendErrorEmbed("Oops!", "You need something to play!")
        );

      var song = {};

      if (ytdl.validateURL(parts[1])) {
        const songInfo = await ytdl.getInfo(parts[1]);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          length: songInfo.videoDetails.lengthSeconds
            .toString()
            .match(/\(.+\)/g)
            .toString()
            .replace(/[()]+/g, ""),
        };
      } else {
        const video = await findVideo(parts.slice(1).join(" "));
        if (video) {
          song = {
            title: video.title,
            url: video.url,
            length: video.duration
              .toString()
              .match(/\(.+\)/g)
              .toString()
              .replace(/[()]+/g, ""),
          };

          try {
            const attachment = new Discord.MessageAttachment(
              await ytdl(song.url, { filter: type.download }),
              `${song.title}.${type.ext}`
            );
            message.channel.send(attachment);
          } catch (err) {
            message.channel.send(err);
          }

        } else {
          message.channel.send(SendErrorEmbed("Oops!", "Error finding Video."));
        }
    }
  
  
    }

  if (parts[0] == "+") {
    //sanity checks

    if (
      message.member.voice.channel.name.includes(
        message.member.user.username
      ) ||
      message.author.id("232510731067588608")
    ) {
      //user owns channel OR HACKERMAN
      if (message.mentions.users.size) {
        //user mentioned someone

        if (!message.member.voice.channel) {
          message.channel.send(
            SendErrorEmbed(
              "You can't do that!",
              "You need to be in a voice channel first!"
            )
          );
        }

        const ownedChannel = message.member.voice.channel;
        const mentionedUser = message.mentions.users.first();
        const mentionedMember = message.mentions.members.first();
        ownedChannel.updateOverwrite(mentionedUser, {
          CONNECT: true,
          SPEAK: true,
          VIEW_CHANNEL: true,
        });

        message.channel.send(
          SendSucessEmbed(
            `You invited ${mentionedUser.username} to your Catacomb!`,
            "They are now able to join, be sure to let them know!"
          )
        );
        console.log(
          `${mentionedMember.user.username} was added to ${message.member.user.username}'s Channel.`
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
      message.member.voice.channel.name.includes(
        message.member.user.username
      ) ||
      message.author.id("232510731067588608")
    ) {
      //user owns channel (or ya know, HACKERMAN)
      if (message.mentions.users.size) {
        //user mentioned someone

        if (!message.member.voice.channel) {
          message.channel.send(
            SendErrorEmbed(
              "You can't do that!",
              "You need to be in your Catacomb for that!"
            )
          );
        }

        const ownedChannel = message.member.voice.channel;
        const mentionedUser = message.mentions.users.first();
        const mentionedMember = message.mentions.members.first();
        ownedChannel.updateOverwrite(mentionedUser, {
          CONNECT: false,
          SPEAK: false,
          VIEW_CHANNEL: false,
        });
        //kick user

        if (mentionedMember.voice.channel == ownedChannel)
          mentionedMember.voice.setChannel(null);

        message.channel.send(
          SendErrorEmbed(
            `You removed ${mentionedUser.username} from your Catacomb!`,
            "They are now unable to join."
          )
        );
        console.log(
          `${mentionedMember.user.username} was removed from ${message.member.user.username}'s Channel.`
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

    const host = message.member.user.username;
    const channelName = `${parts[1]} | ${host} | ⚙`;
    const creationLocation = "856396009966010378";
    const userLimit = parts[2];

    message.member.guild.channels
      .create(channelName, {
        type: "voice",
        parent_id: creationLocation,
      })
      .then((channel) => {
        channel.setParent(creationLocation);
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

/*
    Client.on('guildMemberAdd', async member => {
        const channel = member.guild.channels.cache.find(ch => ch.name.includes('welcome'));
        if (!channel) return;
        
        // Set a new canvas to the dimensions of 700x250 pixels
	const canvas = Canvas.createCanvas(640, 640);
	// ctx (context) will be used to modify a lot of the canvas

    const ctx = canvas.getContext('2d');
    // Since the image takes time to load, you should await it
	const background = await Canvas.loadImage('./sus.png');
	// This uses the canvas dimensions to stretch the image onto the entire canvas
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    //add text
    ctx.font = '48px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`When ${member.displayName} is sus`, (canvas.width / 2) - (ctx.measureText(`When ${member.displayName} is sus`).width / 2 ) , 600 );

	// Use helpful Attachment class structure to process the file for you
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
    
    channel.send(`Welcome to the server, ${member}!`, attachment);

    
    })
    */

function SendErrorEmbed(title, message) {
  const errorEmbed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(message)
    .setColor("#FF0000")
    .setTimestamp()
    .setFooter(version);
  return errorEmbed;
}

function SendSucessEmbed(title, message) {
  const sucessEmbed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(message)
    .setColor("#00FF00")
    .setTimestamp()
    .setFooter(version);
  return sucessEmbed;
}

function SendCorrectUsageEmbed(reason) {
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
      },
      {
        name: ">p",
        value:
          "Plays a song in your current VC.\nSyntax: `>p <Song name or URL>`",
      },
      {
        name: ">q",
        value: "Displays the current queue.\nSyntax: `>q`",
      },
      {
        name: ">skip",
        queue: "Skips the current song.\nSyntax: `>skip`",
      },
      {
        name: ">stop",
        value: "Stops playback, and clears the queue.\nSyntax: `>stop`",
      },
      {
        name: "-3",
        value: "Links the video as an MP3 file.\nSyntax: `-3 <Song name or URL>`",
      },
      {
        name: "-4",
        value:
          "Links the vudeo as a MP4 file.\nSyntax: `-4 <Song name or URL>`",
      }
    )
    .setTimestamp()
    .setFooter(version);
  return HelpEmbed;
}

async function findVideo(query) {
  const result = await ytSearch(query);

  return result.videos.length > 1 ? result.videos[0] : null;
}

/**
 *
 * @param {("PLAYING"|"IDLE")} mode required
 * @param {SongName} song required if playing
 */

function setStatus(mode, song) {
  switch (mode) {
    case "PLAYING":
      Client.user.setActivity(song, {
        type: "LISTENING",
      });

      break;
    case "IDLE":
      Client.user.setActivity("Nothing", {
        type: "LISTENING",
      });
      break;

    default:back
      break;
  }
}

async function playVideo(guild, song) {
  const guildQueue = queue.get(guild.id);

  if (!song) {
    guildQueue.voice_channel.leave();
    queue.delete(guild.id);
    setStatus("IDLE");
    return;
  }

  const stream = ytdl(song.url, { filter: "audioonly" });
  guildQueue.connection
    .play(stream, { seek: 0, volume: 1 })
    .on("finish", () => {
      guildQueue.songs.shift();
      playVideo(guild, guildQueue.songs[0]);
    });
  setStatus("PLAYING", song.title);
  await guildQueue.text_channel.send(
    SendSucessEmbed(":headphones:", `Now playing: **${song.title}**`)
  );
}

function skipSong(message, guildQueue) {
  if (!guildQueue)
    return message.channel.send(
      SendErrorEmbed("Oops!", "There are no songs in the queue to skip!")
    );

  guildQueue.connection.dispatcher.end();
  message.react("👍");
}

function stopSong(message, guildQueue) {
  guildQueue.songs = [];
  guildQueue.connection.dispatcher.end();
  message.react("👍");
}

Client.login(process.env.TOKEN);
