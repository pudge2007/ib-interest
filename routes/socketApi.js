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
  });
};
