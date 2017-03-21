var async = require('async');
var Pin = require('../models/Pins');
var User = require('../models/Users');

module.exports = function (app, passport) {
    
  var isLoggedIn = function (req, res, next) {
  	if (!req.isAuthenticated())
  	  res.send(401);
  	else
      next();		
  }
  
  // API-интерфейс JSON для списка опросов
  app.get('/pins', function(req, res) {
    Pin.find({}, function(error, pins) {
      res.json(pins);
    });
  });
  
  // API-интерфейс JSON для создания нового пина
  app.post('/pin', isLoggedIn, function(req, res) {
    var pinObj = {description: req.body.desc, link: req.body.link, username: req.user.local.username};
    var pin = new Pin(pinObj);
    pin.save(function(err, data) {
      if(err) throw err;
      res.json(data);
    });
  });
  
  // API для удалeния пина
  app.delete('/pin/:id', function(req, res){
    Pin.remove({ _id: req.params.id}, function(err){
      if(err) throw err;
      res.send(200);
    })
  });
  
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile',
      failureRedirect : '/signup',
      failureFlash : true // allow flash messages
  }));

  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile',
      failureRedirect : '/login',
      failureFlash : true // allow flash messages
  }));
  
  // logout
	app.get('/logout', isLoggedIn, function (req, res) { 
	  req.logout();
	  res.redirect('/login'); 
	});
	
	// API для проверки на аутентификацию
  app.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user.local.username : '0');
  });
	
	// API-интерфейс JSON для профиля
  app.get('/user', function(req, res, next) {
    Pin.find({'username': req.user.local.username}, function(err, data) {
      if(err) throw err;
      res.json({pins: data, username: req.user.local.username});
    })
  });
  
};
