"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const Client = new discord_js_1.default.Client();
const dotenv_1 = __importDefault(require("dotenv"));
const version = "Thoth | Ver: 2.1";
dotenv_1.default.config();
console.log("Thoth starting...");
const queue = new Map();
Client.on("ready", () => {
    var _a;
    console.log("Thoth Ready!"); //bot init complete
    console.log(`Logged in as ${(_a = Client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
    console.log(`Server time is ${Date.now()}`);
    console.log(`Websocket heartbeat: ${Client.ws.ping}ms.`);
});
Client.on("voiceStateUpdate", (oldState, newState) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (oldState.channel == null ||
        (oldState.channel != null && newState.channel != null)) {
        //deletes channel if moved out of Catacomb
        if (oldState.channel != null) {
            if (oldState.channel.members.size == 0 &&
                oldState.channel.name.includes("⚙")) {
                oldState.channel.delete();
                console.log(`${oldState.channel.name} was deleted.`);
            }
        }
        // User Joins a voice channel
        // check for bot
        if ((_a = oldState.member) === null || _a === void 0 ? void 0 : _a.user.bot)
            return;
        //check if member joined the create channel
        if (newState.channel == null) {
            return;
        }
        else {
            const privateChannels = ["856396096548503572"];
            const creationLocation = "856396009966010378";
            if (privateChannels.indexOf(newState.channel.id) != -1) {
                //Create Channel
                newState.guild.channels
                    .create(`${(_b = newState.member) === null || _b === void 0 ? void 0 : _b.user.username}'s Catacomb | ⚙`, {
                    type: "voice",
                    parent: creationLocation
                })
                    .then((channel) => {
                    var _a, _b;
                    channel.setParent(creationLocation);
                    (_a = newState.member) === null || _a === void 0 ? void 0 : _a.voice.setChannel(channel);
                    console.log(`${(_b = newState.member) === null || _b === void 0 ? void 0 : _b.user.username} created a Channel.`);
                });
            }
            else
                return;
        }
    }
    else if (newState.channel == null) {
        // User leaves a voice channel
        if (oldState.channel.members.size == 0 &&
            oldState.channel.name.includes("⚙")) {
            oldState.channel.delete();
            console.log(`${oldState.channel.name} was deleted.`);
        }
    }
    if ((_c = newState.member) === null || _c === void 0 ? void 0 : _c.voice.selfDeaf) {
        const afk = newState.guild.afkChannel;
        (_d = newState.member) === null || _d === void 0 ? void 0 : _d.voice.setChannel(afk);
    }
}));
//Commands
Client.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    if (message.author.bot)
        return;
    if (!message.guild)
        return;
    if (message.channel.id == "856373633815281694" &&
        (message.attachments.array().length > 0 || message.embeds.length > 0)) {
        message.react("<:upvote:856401798524436531>").then((react) => {
            message.react("<:meh:856403134720376842>").then((react) => {
                message.react("<:downvote:856401798616580146>");
            });
        });
    }
    const parts = message.content.split(" ");
    if (parts[0] == "+") {
        //sanity checks
        if (((_f = (_e = message.member) === null || _e === void 0 ? void 0 : _e.voice.channel) === null || _f === void 0 ? void 0 : _f.name.includes(message.member.user.username)) ||
            message.author.id == "232510731067588608") {
            //user owns channel OR HACKERMAN
            if (message.mentions.users.size) {
                //user mentioned someone
                if (!((_g = message.member) === null || _g === void 0 ? void 0 : _g.voice.channel)) {
                    message.channel.send(SendErrorEmbed("You can't do that!", "You need to be in a voice channel first!"));
                }
                const ownedChannel = (_h = message.member) === null || _h === void 0 ? void 0 : _h.voice.channel;
                const mentionedUser = message.mentions.users.first();
                const mentionedMember = (_j = message.mentions.members) === null || _j === void 0 ? void 0 : _j.first();
                if (!mentionedUser)
                    return;
                ownedChannel === null || ownedChannel === void 0 ? void 0 : ownedChannel.updateOverwrite(mentionedUser, {
                    CONNECT: true,
                    SPEAK: true,
                    VIEW_CHANNEL: true,
                });
                message.channel.send(SendSucessEmbed(`You invited ${mentionedUser === null || mentionedUser === void 0 ? void 0 : mentionedUser.username} to your Catacomb!`, "They are now able to join, be sure to let them know!"));
                console.log(`${mentionedMember === null || mentionedMember === void 0 ? void 0 : mentionedMember.user.username} was added to ${(_k = message.member) === null || _k === void 0 ? void 0 : _k.user.username}'s Channel.`);
            }
            else {
                message.channel.send(SendErrorEmbed("You can't do that!", "You need to mention a user to invite them!"));
            }
        }
        else {
            message.channel.send(SendErrorEmbed("You can't do that!", "You need to be the owner of this catacomb to invite someone!"));
        }
    }
    if (parts[0] == "-") {
        //sanity checks
        if (((_m = (_l = message.member) === null || _l === void 0 ? void 0 : _l.voice.channel) === null || _m === void 0 ? void 0 : _m.name.includes((_o = message.member) === null || _o === void 0 ? void 0 : _o.user.username)) ||
            message.author.id == "232510731067588608") {
            //user owns channel (or ya know, HACKERMAN)
            if (message.mentions.users.size) {
                //user mentioned someone
                if (!((_p = message.member) === null || _p === void 0 ? void 0 : _p.voice.channel)) {
                    message.channel.send(SendErrorEmbed("You can't do that!", "You need to be in your Catacomb for that!"));
                }
                const ownedChannel = (_q = message.member) === null || _q === void 0 ? void 0 : _q.voice.channel;
                const mentionedUser = message.mentions.users.first();
                const mentionedMember = (_r = message.mentions.members) === null || _r === void 0 ? void 0 : _r.first();
                if (!mentionedUser)
                    return;
                ownedChannel === null || ownedChannel === void 0 ? void 0 : ownedChannel.updateOverwrite(mentionedUser, {
                    CONNECT: false,
                    SPEAK: false,
                    VIEW_CHANNEL: false,
                });
                //kick user
                if ((mentionedMember === null || mentionedMember === void 0 ? void 0 : mentionedMember.voice.channel) == ownedChannel)
                    mentionedMember === null || mentionedMember === void 0 ? void 0 : mentionedMember.voice.setChannel(null);
                message.channel.send(SendErrorEmbed(`You removed ${mentionedUser === null || mentionedUser === void 0 ? void 0 : mentionedUser.username} from your Catacomb!`, "They are now unable to join."));
                console.log(`${mentionedMember === null || mentionedMember === void 0 ? void 0 : mentionedMember.user.username} was removed from ${(_s = message.member) === null || _s === void 0 ? void 0 : _s.user.username}'s Channel.`);
            }
            else {
                message.channel.send(SendErrorEmbed("You can't do that!", "You need to mention a user to invite them!"));
            }
        }
        else {
            message.channel.send(SendErrorEmbed("You can't do that!", "You need to be the owner of this Catacomb to invite someone!"));
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
            message.channel.send(SendCorrectUsageEmbed("You need to specify a channel name!"));
            return;
        }
        else {
            if (!parts[2]) {
                message.channel.send(SendCorrectUsageEmbed("You need to specify a user limit!"));
                return;
            }
            else {
                if (parts[3]) {
                    message.channel.send(SendCorrectUsageEmbed("Too many arguements! Maybe you added an extra space?"));
                    return;
                }
            }
        }
        //if (Number.isInteger(parts[2]) == false){message.channel.send(SendCorrectUsageEmbed("That's not an integer! You need to specify an integer for the user limit!"));return}
        const host = (_t = message.member) === null || _t === void 0 ? void 0 : _t.user.username;
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
            message.channel.send(SendSucessEmbed("Channel Creation success!", `You may now join your channel!`));
            console.log(`${host} Created a looking for group post for ${parts[1]} with user limit ${parts[2]}.`);
        });
    }
    if (parts[0] == ">help") {
        message.channel.send(SendHelpEmbed());
    }
}));
function SendErrorEmbed(title, message) {
    const errorEmbed = new discord_js_1.default.MessageEmbed()
        .setTitle(title)
        .setDescription(message)
        .setColor("#FF0000")
        .setTimestamp()
        .setFooter(version);
    return errorEmbed;
}
function SendSucessEmbed(title, message) {
    const sucessEmbed = new discord_js_1.default.MessageEmbed()
        .setTitle(title)
        .setDescription(message)
        .setColor("#00FF00")
        .setTimestamp()
        .setFooter(version);
    return sucessEmbed;
}
function SendCorrectUsageEmbed(reason) {
    const CUEmbed = new discord_js_1.default.MessageEmbed()
        .setTitle("Incorrect usage!\n Correct usage: \n ++ (Channel Name) (Players Needed)")
        .setDescription(reason)
        .setColor("#FFFF00")
        .addFields({
        name: "Channel Name",
        value: "Name of the voice channel, limited to 24 characters.",
    }, {
        name: "Players needed",
        value: "An integer value, limited at 99",
    }, {
        name: "Example Usage",
        value: "++ MC_Bedwars 4 | Would create a channel named MC_Bedwars with a user limit of 4",
    })
        .setTimestamp()
        .setFooter(version);
    return CUEmbed;
}
function SendHelpEmbed() {
    const HelpEmbed = new discord_js_1.default.MessageEmbed()
        .setTitle("Help")
        .setDescription("Use this bot to create and manage Catacombs, along with playing and downloading music!")
        .setColor("#00FF00")
        .addFields({
        name: "+",
        value: "Adds a user to your Catacomb.\nSyntax: `+ <Mention>`",
    }, {
        name: "-",
        value: "Removes someone from your Catacomb.\nSyntax: `- <Mention>`",
    })
        .setTimestamp()
        .setFooter(version);
    return HelpEmbed;
}
Client.login(process.env.TOKEN);
