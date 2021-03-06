var app = angular.module('pinterest', ['ngResource', 'ngRoute', 'wu.masonry', '720kb.tooltips']);

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
  
app.directive('onErrorSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.onErrorSrc) {
          attrs.$set('src', attrs.onErrorSrc);
        }
      });
    }
  }
});

app.factory('getUsername', ['$rootScope', '$http', function($rootScope, $http) {
  return $http.get('/loggedin');
}]);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', 'tooltipsConfProvider', function($routeProvider, $locationProvider, $httpProvider, tooltipsConfProvider) {
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
    .when('/login',{ templateUrl: 'partials/login.ejs', controller: 'LoginCtrl'})
    .when('/signup',{ templateUrl: 'partials/signup.ejs', controller: 'SignupCtrl'});
    
  $routeProvider.otherwise({ redirectTo: "/" });
  $locationProvider.html5Mode({ enabled: true, requireBase: false});
  $httpProvider.interceptors.push('loggedInterceptor');

  tooltipsConfProvider.configure({'side':'bottom', 'size':'small', 'speed': 'fast'});

}]);

app.run(['$http', '$rootScope', 'getUsername', function($http, $rootScope, getUsername){
  getUsername.then(function(response) {
    $rootScope.username = response.data;
  })
}])

//nav buttons
app.controller('MainCtrl', ['$scope', '$rootScope','getUsername', function($scope, $rootScope, getUsername){
  getUsername.then(function(response) {
    response.data === '0' ? $scope.showing = false : $scope.showing = true;
  })
}]);

//all polls to index page
app.controller('ListCtrl', ['$scope','$http', '$rootScope','socket', function($scope, $http, $rootScope, socket){
  
  $scope.checkUs = $rootScope.username;
  (($scope.checkUs !== '0') && ($scope.checkUs !== undefined)) ? $scope.disabled = false : $scope.disabled = true;
  
  $http.get('/pins').then(function(response){
    $scope.pins = response.data;
      $scope.pins.forEach(function(item) {
        if(!$scope.disabled) {
          item.voted = item.likes.some(function (like) {
            return like.user === $scope.checkUs;
          })
          item.rep = item.reposts.some(function (repost) {
            return repost.user === $scope.checkUs;
          })
        } else
          item.voted = item.rep = false;
      })
  });
  
  $scope.sorting = function (username) {
    $scope.sortByUsername = username;
  }
  
  $scope.like = function (id) {
    if(!$scope.disabled){
      var pinLiked = {id: id, user: $scope.checkUs}
      socket.emit('setLike', pinLiked);
    }
  }
  
  $scope.repost = function (id) {
    if(!$scope.disabled){
      var pinReposted = {id: id, user: $scope.checkUs}
      socket.emit('setRepost', pinReposted);
    }
  }
  
  socket.on('getPin', function(data) {
    $scope.pins = data;
  });
    
  socket.on('getLikes', function(data) {
    if(data.status === 'add') {
      $scope.pins.forEach(function(item) {
        if(item._id === data.id) {
          item.totalLikes++;
          item.likes = data.likes;
        }
        item.voted = item.likes.some(function (like) {
          return like.user === $scope.checkUs;
        })
      })
    }
    else if(data.status === 'delete') {
      $scope.pins.forEach(function(item) {
        if(item._id === data.id) {
          item.totalLikes--;
          item.likes = data.likes;
        }
        item.voted = item.likes.some(function (like) {
          return like.user === $scope.checkUs;
        })
      })
    }
  });
  
  socket.on('getReposts', function(data) {
    if(data.status === 'add') {
      $scope.pins.forEach(function(item) {
        if(item._id === data.id) {
          item.totalReposts++;
          item.reposts = data.reposts;
        }
        item.rep = item.reposts.some(function (repost) {
          return repost.user === $scope.checkUs;
        })
      })
    }
    else if(data.status === 'delete') {
      $scope.pins.forEach(function(item) {
        if(item._id === data.id) {
          item.totalReposts--;
          item.likes = data.likes;
          item.reposts = data.reposts;
        }
        item.rep = item.reposts.some(function (repost) {
          return repost.user === $scope.checkUs;
        })
      })
    }
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
    $scope.userPins = response.data.pins.myPins;
    $scope.userReposts = response.data.pins.myReposts;
  })
  
  $scope.deletePoll = function(id){
    socket.emit('deletePin', id, function(data) {
      if(data) $route.reload();
    });
  }
  
  $scope.deleteRepost = function(id){
    socket.emit('deleteRepost', {id:id, user: $scope.username}, function(data) {
      if(data) $route.reload();
    });
  }
    
}]);

//login and sigup errors
app.controller('LoginCtrl', ['$scope', '$http', function($scope, $http){
  $http.get('/loginErrors').then(function(response) {
    $scope.errorMsg = response.data[0];
  })
}]);
app.controller('SignupCtrl', ['$scope', '$http', function($scope, $http){
  $http.get('signupErrors').then(function(response) {
    $scope.errorMsg = response.data[0];
  })
}]);