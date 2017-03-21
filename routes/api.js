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
  
  // API-интерфейс JSON для создания нового пина в socketApi
  
  // API для удалeния пина в socketApi
  
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile',
      failureRedirect : '/signup'
  }));

  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile',
      failureRedirect : '/login'
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
