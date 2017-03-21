var mongoose = require('mongoose');

var PinSchema = new mongoose.Schema({
  description: String,
  link: String,
  username: String
});

module.exports = mongoose.model('Pin', PinSchema);