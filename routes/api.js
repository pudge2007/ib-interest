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
  
  // API-интерфейс JSON для профиля
  app.get('/user', isLoggedIn, function(req, res, next) {
    async.parallel({
      myPins: function(callback){
        return Pin.find({'username': req.user.local.username}, function(err, pins) {
          return callback(err, pins);
        });
      },
      myReposts: function(callback){
        return Pin.find({'reposts':{$elemMatch: {'user':req.user.local.username}}}, function(err, rep) {
          return callback(err, rep);
        });
      },
    }, function(err, results){
      if(err) throw err;
      res.json({pins: results, username: req.user.local.username});
    })
  });
  
  // auth
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile',
      failureRedirect : '/signup'
  }));

  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile',
      failureRedirect : '/login'
  }));

	app.get('/logout', isLoggedIn, function (req, res) { 
	  req.logout();
	  res.redirect('/login'); 
	});
	
	// API для проверки на аутентификацию
  app.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user.local.username : '0');
  });
  
};
