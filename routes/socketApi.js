var mongoose = require('mongoose');
var Pin = mongoose.model('Pin');

module.exports = function(io) {
  
  io.sockets.on('connection', function (socket) {
    function find() {
      Pin.find({}, function(error, pins) {
        socket.broadcast.emit('getPin', pins);
      });
    }  
    
    // API-интерфейс JSON для создания нового пина
    socket.on('postPin', function(data) {
      var pinObj = {description: data.desc, link: data.link, username: data.username};
      var pin = new Pin(pinObj);
      pin.save(function(err) {
        if(err) throw err;
        find();
      });
    });
    
    // API-интерфейс JSON для удаления пина
    socket.on('deletePin', function(data, callback) {
      callback(true);
      Pin.remove({ _id: data}, function(err, data){
        if(err) throw err;
        find();
      })
    })
    
    //API для лайков
    socket.on('setLike', function(data) {
      Pin.findById(data.id, function(err, pin) {
        if (err) throw err;
        var checkVoted = pin.likes.some(function(like) {
          return like.user === data.user;
        })
        if(!checkVoted) {
          pin.likes.push({ user: data.user });
          pin.totalLikes++;
          pin.save(function(err, doc) {
            if (err) throw err;
            io.sockets.emit('getLikes', {likes: pin.likes, id: pin._id, status: 'add'});
          });
        } else {
          Pin.update({_id: data.id}, {$pull: {likes: {user: data.user}}, $inc: {totalLikes: -1}}, function(err) {
            if (err) throw err;
            Pin.findById(data.id, function(err, pin) {
              io.sockets.emit('getLikes', {likes: pin.likes, id: pin._id, status: 'delete'});
            })
          })
        }
      });
    });
  });
};