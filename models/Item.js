const { Schema, model } = require('mongoose');

const itemSchema = new Schema({
  name: {
    type: String,
    unique: true
  },
  description: String,
  price: Number,
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  roles: [String],
  misc: [String],
  usable: Boolean,
  instantUse: Boolean
});

//Model Methods
itemSchema.statics.createItem = async function(
  itemName,
  description,
  price,
  discount,
  roles,
  misc,
  usable,
  instantUse
) {
  const item = await this.findOne({ name: itemName }).exec();

  if (item) return { res: 'already_exists', item };

  return await new this({
    name: itemName,
    description: description,
    price,
    discount,
    roles: roles.split(',').map(role => role.trim()),
    misc: misc.split(',').map(misce => misce.trim()),
    usable,
    instantUse
  }).save();
};
model('Item', itemSchema);
