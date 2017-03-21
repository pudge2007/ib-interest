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

app.factory('socket',['$rootScope', function($rootScope) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  }]);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
  var checkLoggedin = function($q, $http, $location, $rootScope){
    var deferred = $q.defer();
    $http.get('/loggedin').then(function(response){
      if (response.data !== '0') {
        deferred.resolve();
      }
      else { 
        $location.url('/login');
        deferred.reject();
      } 
    }); 
    return deferred.promise; 
  };

  $routeProvider
    .when('/', { templateUrl: 'partials/home.ejs', controller: 'ListCtrl'})
    .when('/new',{ templateUrl: 'partials/new.ejs', controller: 'NewCtrl', resolve: { loggedin: checkLoggedin }})
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
    $rootScope.username = response.data;
    if (response.data !== '0') {
      $rootScope.showing = true;
      deferred.resolve();
    }
    else {
      $rootScope.showing = false;
      deferred.reject();
    } 
  }); 
}]);

//all polls to index page
app.controller('ListCtrl', ['$scope','$http', '$rootScope','socket', function($scope, $http, $rootScope, socket){
  $scope.checkUs = $rootScope.username;
  $http.get('/pins').then(function(response){
    $scope.pins = response.data;
  });
  $scope.sorting = function (username) {
    $scope.sortByUsename = username;
  }
  
  socket.on('getPin', function(data) {
    $scope.pins = data;
  });
  
}]);

//create new pin
app.controller('NewCtrl', ['$scope', '$http', '$location','$rootScope','socket', function($scope, $http, $location, $rootScope, socket){
    $scope.desc = '';
    $scope.link ='';
    $scope.createPin = function() {
      var pin = {desc: $scope.desc, link: $scope.link, username: $rootScope.username};
      socket.emit('postPin', pin);
      $location.path('/profile');
    };
}]);

//profile controller
app.controller('UserCtrl', ['$scope', '$route', '$http','socket', function($scope, $route, $http, socket){
  $http.get('/user').then(function(response){
    $scope.username = response.data.username;
    $scope.userPins = response.data.pins;
  })
  
  $scope.deletePoll = function(id){
    socket.emit('deletePin', id, function(data) {
      if(data) $route.reload();
    });
  }
    
}]);