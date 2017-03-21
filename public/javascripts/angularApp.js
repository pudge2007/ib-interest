var app = angular.module('pinterest', ['ngResource', 'ngRoute', 'wu.masonry']);

app.factory('loggedInterceptor', ['$rootScope', '$q', '$location', function($rootScope, $q, $location) {
  return { 
    responseError: function(response) { 
      if (response.status === 401){
        $location.url('/login');
        return $q.reject(response);
      }
      else
        return $q.reject(response); 
    } 
  };
}]);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
  var checkLoggedin = function($q, $http, $location, $rootScope){
    var deferred = $q.defer();
    $http.get('/loggedin').then(function(response){
      if (response.data !== '0') {
        deferred.resolve();
        $rootScope.userId = response.data;
      }
      else { 
        deferred.reject();
        $location.url('/login');
      } 
    }); 
    return deferred.promise; 
  };

  $routeProvider
    .when('/', { templateUrl: 'partials/home.ejs', controller: 'ListCtrl' })
    .when('/poll/:id',{ templateUrl: 'partials/poll.ejs', controller: 'ItemCtrl' })
    .when('/new',{ templateUrl: 'partials/new.ejs', controller: 'NewPollCtrl', resolve: { loggedin: checkLoggedin }})
    .when('/profile',{ templateUrl: 'partials/profile.ejs', controller: 'UserCtrl', resolve: { loggedin: checkLoggedin } })
    .when('/login',{ templateUrl: 'partials/login.ejs'})
    .when('/signup',{ templateUrl: 'partials/signup.ejs'});
    
  $routeProvider.otherwise({ redirectTo: "/" });
  $locationProvider.html5Mode({ enabled: true, requireBase: false});
  $httpProvider.interceptors.push('loggedInterceptor');
}]);

// nav buttons  
app.controller('MainCtrl', ['$scope', '$q', '$http', '$rootScope', function($scope, $q, $http, $rootScope){
    var deferred = $q.defer();
    $http.get('/loggedin').then(function(response){
      if (response.data !== '0') {
        deferred.resolve();
        $scope.showing = true;
      }
      else {
        $scope.showing = false;
        deferred.reject();
      } 
    }); 
}]);

//all polls to index page
app.controller('ListCtrl', ['$scope','$http', function($scope, $http){
  
  $http.get('/pins').then(function(response){
    $scope.pins = response.data;
  });
}]);

//single poll
app.controller('ItemCtrl', ['$scope', '$route', '$routeParams', '$http', function($scope, $route, $routeParams, $http){

  
  $http.get('/polls/' + $routeParams.id).then(function(response){
    $scope.poll = response.data;
  });  
  
  var socket = io.connect();                         
  socket.on('myvote', function(data) {
    if(data._id === $routeParams.pollId) {
        $scope.poll = data;
    }
  });
  socket.on('vote', function(data) {
    if(data._id === $routeParams.pollId) {
        $scope.poll.choices = data.choices;
        $scope.poll.totalVotes = data.totalVotes;
      }   
  });
  
  $scope.vote = function() {
    var pollId = $scope.poll._id;
    var choiceId = $scope.poll.userVote;
    if(choiceId) {
      var voteObj = { poll_id: pollId, choice: choiceId };
      socket.emit('send:vote', voteObj);
      $route.reload();
    } else {
      alert('You must select an option to vote for');
    }
  };
}]);

//create new pin
app.controller('NewPollCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
  
    $scope.desc = '';
    $scope.link ='';
    $scope.createPin = function() {
      var pin = {desc: $scope.desc, link: $scope.link};
      if(pin.desc.length > 0 && pin.link.length > 0) {
          $http.post('/pin', pin).then(function(response){
            $location.path('/profile'); 
          });
      } else {
        alert('You must enter a description and source link');
      }
    };
}]);

//profile controller
app.controller('UserCtrl', ['$scope', '$route', '$http', function($scope, $route, $http){
  $http.get('/user').then(function(response){
    $scope.username = response.data.username;
    $scope.userPins = response.data.pins;
  })
  
  $scope.deletePoll = function(id){
    $http.delete('/pin/' + id).then(function(){
      console.log('deleted')
    })
    $route.reload();
  }
    
}]);