//Dependencies
const { Event } = require('klasa');
const mongoose = require('mongoose');

//Init
const Profile = mongoose.model('Profile');

module.exports = class extends Event {
  constructor(...args) {
    super(...args, {
      enabled: true,
      once: false
    });
  }

  async run(member) {
    //Register Profile
    const profile = await Profile.register(member.id);

    if (profile.res === 'already_exists') {
      const previousRoles = profile.profile.previousRoles.find(
        roles => roles.guildID === member.guild.id
      );
      previousRoles.forEach(roleName => {
        const role = member.guild.roles.find(r => r.name === roleName);
        member.addRole(role, 'Assigning roles this member had before leaving');
      });
    } else if (member.guild.settings.joinRole)
      member.addRole(member.guild.settings.joinRole, 'Assigning Member role');
  }
};