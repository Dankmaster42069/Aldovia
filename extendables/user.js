//Dependencies
const { Extendable } = require('klasa');
const { User, MessageEmbed } = require('discord.js');
const { model } = require('mongoose');
const _ = require('lodash');

//Init
const Profile = model('Profile');
const Inventory = model('Inventory');
const Pet = model('Pet');

module.exports = class extends Extendable {
  constructor(...args) {
    super(...args, {
      enabled: true,
      appliesTo: [User],
    });
  }

  /**
   * Register a user's profile
   *
   * @returns {boolean} - True if profile was register, false if profile already exists
   */
  async register() {
    const profile = await Profile.findOne({ memberID: this.id }).exec();

    if (profile) return false;

    return await Profile.register(this.id);
  }

  /**
   * Get User's profile embed
   * @param {String} guildID - ID of the guild to fetch profile for
   *
   * @returns {MessageEmbed} - MessageEmbed containing profile or error
   */
  async getProfileEmbed(guildID) {
    const aldovia = this.client.guilds.get('556442896719544320');
    const profile = await Profile.findOne({ memberID: this.id }).exec();
    const pet = await Pet.findOne({ memberID: this.id }).exec();

    if (!profile) return this._noProfile();

    //Generating basic embed
    const profileEmbed = new MessageEmbed()
      .setThumbnail(this.displayAvatarURL({ size: 256 }))
      .addField('❯ Name', this.username, true)
      .addField('❯ ID', this.id, true)
      .addField('❯ Description', profile.description)
      .setColor(profile.profileColor);

    //Checking Aldovia Title
    let isOwner = false;

    for (const owner of this.client.owners)
      if (owner.id === this.id) isOwner = true;

    //If is owner
    if (isOwner) profileEmbed.setFooter('👑 Aldovia Admin 👑');
    //If is 🛡 Senior Moderator
    else if (
      aldovia.members
        .get(profile.memberID)
        .roles.find((r) => r.name === '🛡 Senior Moderator')
    )
      profileEmbed.setFooter('🛡 Senior Moderator');
    //If is Moderator
    else if (
      aldovia.members
        .get(profile.memberID)
        .roles.find((r) => r.name === 'Moderator')
    )
      profileEmbed.setFooter('Moderator');
    //Else
    else {
      if (profile.activeBadge) profileEmbed.setFooter(profile.activeBadge);
      const rep = profile.reputation.find(
        (reputation) => reputation.guildID === guildID,
      ).rep;

      if (rep)
        profileEmbed.addField(
          '❯ Reputation',
          `${rep <= 20 ? '⚠️' : ''} ${rep} 🏆`,
          true,
        );
      else
        profileEmbed.addField(
          '❯ Reputation',
          'Not configured (use `setup`)',
          true,
        );
    }

    //If member is married
    if (profile.marriedTo)
      profileEmbed.addField(
        '❯ Married To',
        this.client.guilds
          .find((guild) => guild.members.get(profile.marriedTo) !== undefined)
          .members.get(profile.marriedTo).displayName ||
          this.client.users.get(profile.marriedTo).username ||
          '[Left Aldovia Network...]',
        true,
      );

    profileEmbed.addField('❯ Favorite Anime', profile.favoriteAnime, true);

    if (pet)
      profileEmbed.addField(
        '❯ Pet',
        `${
          pet.petType === 'cat' ? '🐱' : pet.petType === 'dog' ? '🐶' : '❓'
        } ${pet.petName}`,
        true,
      );

    return profileEmbed;
  }

  /**
   * Get Inventory Embed
   *
   * @param {boolean} [partner=false] - Whether this is partner's inventory
   * @returns {MessageEmbed} - MessageEmbed containing inventory or error
   */
  async getInventoryEmbed(partner = false) {
    const aldovia = this.client.guilds.get('556442896719544320');
    const profile = await Profile.findOne({
      memberID: this.id,
    }).exec();

    if (!profile) return this._noProfile();

    if (!profile.marriedTo && partner)
      return new MessageEmbed()
        .setTitle('Not married')
        .setDescription(
          "You can't view your partner's inventory when you have no partner... You did an Ooopsie!",
        )
        .setColor('#f44336');

    const inventory = await Inventory.findOne({
      memberID: partner ? profile.marriedTo : this.id,
    }).exec();

    let inventoryStr = '';
    const inventoryItems = {};

    inventory.inventory.forEach((item) => {
      inventoryItems[item] = inventoryItems[item] + 1 || 1;
    });

    for (var item in inventoryItems)
      inventoryStr +=
        inventoryItems[item] > 1
          ? `${item} x${inventoryItems[item]}\n`
          : `${item}\n`;

    //Checking Aldovia Title
    let isOwner = false;

    for (const owner of this.client.owners)
      if (owner.id === inventory.memberID) isOwner = true;

    if (
      aldovia.members.get(inventory.memberID) !== undefined &&
      (isOwner ||
        aldovia.members
          .get(inventory.memberID)
          .roles.find((r) => r.name === '🛡 Senior Moderator') ||
        aldovia.members
          .get(inventory.memberID)
          .roles.find((r) => r.name === 'Moderator'))
    )
      return new MessageEmbed()
        .setTitle('No Inventory')
        .setDescription(
          "🛡 Senior Moderators and Server Admins can't view/use their inventory",
        )
        .setColor('#f44336');

    return new MessageEmbed()
      .setTitle(
        `${this.client.users.get(inventory.memberID).username ||
          'Unknown'}'s Inventory`,
      )
      .addField('Coins', inventory.coins)
      .addField('Inventory', inventoryStr || '[Inventory is empty]')
      .setColor('#2196f3');
  }

  /**
   * Get Badges embed
   * @returns {MessageEmbed} - Message embed containing badges
   */
  async getBadgesEmbed() {
    const aldovia = this.client.guilds.get('556442896719544320');
    const profile = await Profile.findOne({
      memberID: this.id,
    }).exec();

    if (!profile) return this._noProfile();

    //Checking Aldovia Title
    let isOwner = false;

    for (const owner of this.client.owners)
      if (owner.id === profile.memberID) isOwner = true;

    if (
      aldovia.members.get(profile.memberID) !== undefined &&
      (isOwner ||
        aldovia.members
          .get(profile.memberID)
          .roles.find((r) => r.name === '🛡 Senior Moderator') ||
        aldovia.members
          .get(profile.memberID)
          .roles.find((r) => r.name === 'Moderator'))
    )
      return new MessageEmbed()
        .setTitle('No Badges')
        .setDescription(
          "🛡 Senior Moderators and Server Admins can't view/use their badges",
        )
        .setColor('#f44336');

    let badgesString = '';

    if (profile.badges.length < 1) badgesString = false;
    else profile.badges.forEach((badge) => (badgesString += `${badge}\n`));

    return new MessageEmbed()
      .setTitle(
        `${this.client.users.get(profile.memberID).username ||
          'Unknown'}'s Badges`,
      )
      .addField('Active Badge', profile.activeBadge || '[No active badge]')
      .addField('All Badges', badgesString || '[No badges]')
      .setColor('#2196f3');
  }

  /**
   * Edit a profile
   *
   * @param {String} key - Key to edit
   * @param {String} value - New value for specified key
   * @returns {true} - True
   */
  async editProfile(key, value) {
    let profile = await Profile.findOne({ memberID: this.id }).exec();

    if (!profile) profile = await Profile.register(this.id);

    await profile.edit(key, value);
    return true;
  }

  /**
   * Edit Reputation of a user
   *
   * @param {('+'|'-')} change - Add (+) or deduct (-) rep?
   * @param {number} amount - amount of rep to add/deduct
   * @param {String} guildID - ID of guild to add/deduct rep for
   * @returns {boolean} - True if reputation was added/deducted, False if user was banned due to low rep
   */
  async editReputation(change, amount, guildID) {
    const aldovia = this.client.guilds.get('556442896719544320');
    let profile = await Profile.findOne({ memberID: this.id }).exec();

    //Checking Aldovia Title
    let isOwner = false;

    for (const owner of this.client.owners)
      if (owner.id === profile.memberID) isOwner = true;

    if (
      isOwner ||
      aldovia.members
        .get(profile.memberID)
        .roles.find((r) => r.name === '🛡 Senior Moderator') ||
      aldovia.members
        .get(profile.memberID)
        .roles.find((r) => r.name === 'Moderator')
    )
      return true;

    if (!profile) profile = await Profile.register(this.id);

    if (change === '+') return await profile.addReputation(amount, guildID);
    else {
      const res = await profile.deductReputation(amount, guildID);
      if (!res && this.client.guilds.get(guildID).settings.banOnLowRep) {
        this.client.guilds
          .get(guildID)
          .members.get(this.id)
          .ban({ reason: 'Reached 0 Reputation' });
      }
      return res;
    }
  }

  /**
   * Add or deduct coins of a user
   *
   * @param {('+'|'-')} change - Add (+) or deduct (-)
   * @param {number} amount - Amount of coins to add/deduct
   * @returns {true} - True
   */
  async editCoins(change, amount) {
    let profile = await Profile.findOne({ memberID: this.id }).exec();

    if (!profile) profile = await Profile.register(this.id);

    const inventory = await Inventory.findOne({ memberID: this.id }).exec();

    if (change === '+') await inventory.addCoins(amount);
    else await inventory.deductCoins(amount);
    return true;
  }

  /**
   * Give a badge to a member
   *
   * @param {string} badgeName - Badge to give
   * @returns {boolean} - True if badge was given & false if badge is already given
   */
  async giveBadge(badgeName) {
    let profile = await Profile.findOne({ memberID: this.id }).exec();

    if (!profile) profile = await Profile.register(this.id);

    if (_.includes(profile.badges, badgeName)) return false;
    else profile.badges.push(badgeName);

    await profile.save();

    return true;
  }

  /**
   * Set an active badge
   *
   * @param {string} badgeName - Badge to set active
   * @returns {boolean} - True if badge was given & false if badge is already given
   */
  async setActiveBadge(badgeName) {
    let profile = await Profile.findOne({ memberID: this.id }).exec();

    if (!profile) return this._noProfile(true);

    if (!_.includes(profile.badges, badgeName)) return false;
    else {
      if (profile.activeBadge) profile.badges.push(profile.activeBadge);
      profile.activeBadge = badgeName;
      profile.badges = profile.badges.filter((badge) => badge !== badgeName);
    }

    await profile.save();

    return true;
  }

  /**
   * Setup profile for a guild
   * @param {String} guildID - ID of guild to setup this profile for
   * @returns {MessageEmbed} - Embed containing details
   */
  async setupProfile(guildID) {
    const profile = await Profile.findOne({ memberID: this.id }).exec();

    if (!profile) return this._noProfile(true);

    if (profile.reputation.find((rep) => rep.guildID === guildID))
      return MessageEmbed({
        title: 'Already Configured',
        description: 'Your profile is already configured for this server',
        color: '#f44336',
      });

    profile.reputation.push({
      guildID: guildID,
      rep: 50,
    });

    await profile.save();

    return MessageEmbed({
      title: 'Setup complete',
      description: 'Your profile is configured for this server',
      color: '#2196f3',
    });
  }

  _noProfile(isAuthor = false) {
    return isAuthor
      ? new MessageEmbed()
          .setTitle('Profile not found')
          .setDescription(
            "Your profile doesn't exist, use `register` command to register",
          )
          .setColor('#f44336')
      : new MessageEmbed()
          .setTitle('Profile not found')
          .setDescription(
            "The profile you're looking for doesn't exist, if it's your profile, use `register` command to register",
          )
          .setColor('#f44336');
  }
};
