var mongoose = require('mongoose');

var LikeSchema = new mongoose.Schema({ user: String });
var RepostSchema = new mongoose.Schema({ user: String });

var PinSchema = new mongoose.Schema({
  description: String,
  link: String,
  username: String,
  likes: [LikeSchema],
  reposts: [RepostSchema],
  totalLikes: {type: Number, default: 0 },
  totalReposts: {type: Number, default: 0 }
});

module.exports = mongoose.model('Pin', PinSchema);