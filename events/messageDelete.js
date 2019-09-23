const { Event } = require('klasa');
const { model } = require('mongoose');

// Init
const Log = model('Log');

module.exports = class extends Event {
  async run(message) {
    await new Log({
      guildID: message.guild.id,
      event: 'messageDelete',
      data: {
        authorID: message.author.id,
        channelID: message.channel.id,
        content: message.content,
        createdAt: message.createdAt,
        edits: message.edits,
        id: message.id,
        type: message.type,
      },
    }).save();
  }
};
