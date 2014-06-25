'use strict';
/*global angular:true, console:true, localStorage: true*/
// //http://alvarosanchez.github.io/grails-spring-security-rest/docs/guide/introduction.html
//http://asoftwareguy.com/
// https://github.com/philipsorst/angular-rest-springsecurity/blob/master/src/main/webapp/js/app.js
//to wire in
// include <script src='bower_components/angular-http-auth/src/http-auth-interceptor.js'></script>
// in your index.html
// add as a dependency of your app
/*var myApp = angular.module('myApp', ['avaughan.logging',
 'http-auth-interceptor'
 ]); */
var AVaughanLoginConfig = {
    restCallsWillContain: 'api',
    loginUrlForRemote: '/api/login',
    loginUserLabel: 'username',
    loginPassLabel: 'password',
    logoutUrlForRemote: '/api/logout',
    redirectIfTokenNotFound: false,
    redirectIfTokenNotFoundUrl: '/login',
    redirectAfterLogin: false,
    defaultUrlAfterLogin: '/',
    authManager: undefined,
    setAuthManager: function (authManager) {
      this.authManager = _.extend(authManager, {});
    }
  };
/* jshint ignore:start*/
var AVaughanLoginConfigFactory = {
    create: function (properties, authManager) {
      var config = _.extend(AVaughanLoginConfig, properties);
      config.setAuthManager(authManager);
    }
  };
/* jshint ignore:end*/
var AVaughanLogin = AVaughanLogin || {
    loginConfig: _.extend(AVaughanLoginConfig, {}),
    getAuthManager: function () {
      return this.loginConfig.authManager;
    },
    authService: undefined,
    logger: undefined,
    $rootScope: undefined,
    construct: function (avaughanLoginConfig) {
      //this.logger.info('AVaughanLogin initialize called with config: ', [avaughanLoginConfig]);
      if (avaughanLoginConfig) {
        this.loginConfig = avaughanLoginConfig;
      }
    },
    initialize: function (authService, avLog, $rootScope) {
      this.logger = avLog.getLogger('AVaughanLogin');
      this.logger.debug('avaughan.login get called', authService);
      this.setAuthService(authService);
      this.getAuthManager().setLog(avLog);
      this.$rootScope = $rootScope;
    },
    interceptHttpRequests: function ($httpProvider) {
      /**
         * register an interceptor to push auth tokens on the requests
         */
      $httpProvider.interceptors.push(this.getRequestInterceptor());
    },
    setAuthService: function (authService) {
      if (authService) {
        this.logger.debug('setting authService ', authService);
        this.authService = authService;
      }
    },
    login: function (username, password, $http, $rootScope, $cookieStore, $location) {
      this.logger.debug('service login called ', [
        'location',
        $location,
        'http',
        $http,
        '$rootScope',
        $rootScope,
        '$cookieStore',
        $cookieStore
      ]);
      var postData = {};
      postData[this.loginConfig.loginUserLabel] = username;
      postData[this.loginConfig.loginPassLabel] = password;
      var self = this;
      $http.post(this.loginConfig.loginUrlForRemote, postData, this.getAuthenticateHttpConfig).success(function (data) {
        self.logger.info('Login successful for user: ', [
          username,
          data,
          self.loginConfig
        ]);
        self.getAuthManager().save(data, $rootScope, $cookieStore);
        self.authService.loginConfirmed(data, self.configUpdateFunction);
        if (self.loginConfig.redirectAfterLogin) {
          self.logger.info('should redirect after login', $location.path(), $location.search());
          if ($location.search().originalUrl) {
            self.logger.info('original url found', $location.search().originalUrl);
            var url = $location.search().originalUrl;
            $location.search('originalUrl', null);
            $location.path(url);
          } else {
            self.logger.info('using default url to redirect after login', $location.path().originalUrl);
            $location.path(self.loginConfig.defaultUrlAfterLogin);
          }
        }
      }).error(function (data) {
        self.logger.error('login error: ' + data);
        self.loginFailed(data);
      });
    },
    loginConfirmed: function (user) {
      this.logger.info('loginConfirmed', user);
      this.authService.loginConfirmed(user, this.configUpdateFunction);
    },
    loginFailed: function (rejection) {
      this.logger.warn('broadcasting login failed: ');
      this.$rootScope.$broadcast('event:auth-loginFailed', rejection);
    },
    logout: function ($http, $cookieStore, $rootScope) {
      this.logger.debug('logout called');
      var self = this;
      $http.post(this.loginConfig.logoutUrlForRemote, {}, this.getHttpConfig()).success(function () {
        self.logger.info('Logout successful');
        self.getAuthManager().clear($cookieStore, $rootScope);
        //remove any user data
        $rootScope.$broadcast('event:auth-logoutConfirmed', '');
      }).error(function (data) {
        self.logger.error('logout error: ' + data);
      });
    },
    getRequestInterceptor: function () {
      if (this.logger) {
        this.logger.debug('get request interceptor called');
      } else {
        console.log('get request interceptor called');
      }
      var self = this;
      return [
        '$q',
        '$rootScope',
        '$cookieStore',
        '$location',
        function ($q, $rootScope, $cookieStore, $location) {
          return {
            'request': function (config) {
              self.logger.debug('avaughan.login request interceptor - request!!!!', [
                self.getAuthManager().getTokenValues($rootScope),
                config
              ]);
              var isRestCall = config.url.indexOf(self.loginConfig.restCallsWillContain) >= 0;
              self.logger.debug('avaughan.login request is rest call?', [
                isRestCall,
                config.url
              ]);
              if (isRestCall && self.getAuthManager().isTokenAvailable($rootScope, $cookieStore)) {
                self.getAuthManager().setAuthOnRequest($rootScope, config);
              } else {
                self.logger.debug('avaughan.login token is not available, or not rest call');
              }
              return config || $q.when(config);
            },
            'responseError': function (rejection) {
              self.logger.error('avaughan.login request interceptor - responseError', rejection);
              self.loginFailed(rejection);
              if (rejection.status === 403 && self.loginConfig.redirectIfTokenNotFound) {
                self.logger.info('got 403 and configured to redirect', self.loginConfig.redirectIfTokenNotFoundUrl);
                $location.search('originalUrl', $location.path());
                $location.path(self.loginConfig.redirectIfTokenNotFoundUrl);
              }
              return $q.reject(rejection);
            },
            'response': function (response) {
              self.logger.debug('avaughan.login request interceptor - response', response);
              // do something on success
              return response;
            }
          };
        }
      ];
    },
    isTokenAvailable: function ($rootScope, $cookieStore) {
      return this.getAuthManager().isTokenAvailable($rootScope, $cookieStore);
    },
    checkRequest: function ($location, $cookieStore, $rootScope) {
      /* Try getting valid user from cookie or go to login page */
      var originalPath = $location.path();
      this.getAuthManager().load($cookieStore, $rootScope);
      if (this.getAuthManager().isTokenAvailable($rootScope, $cookieStore)) {
        if (this.logger) {
          this.logger.debug('app.js routing to path', originalPath);
        } else {
          console.log('app.js routing to path', originalPath);
        }
        $location.path(originalPath);
      } else {
        if (this.loginConfig.redirectIfTokenNotFound) {
          if (this.logger) {
            this.logger.debug('not authorized, routing', this.loginConfig.redirectIfTokenNotFoundUrl);
          } else {
            console.log('not authorized, routing', this.loginConfig.redirectIfTokenNotFoundUrl);
          }
          console.log('location.path ', $location.path(), this.loginConfig.redirectIfTokenNotFoundUrl);
          if ($location.path() !== '' && $location.path() !== this.loginConfig.redirectIfTokenNotFoundUrl) {
            $location.search('originalUrl', $location.path());
          }
          $location.path(this.loginConfig.redirectIfTokenNotFoundUrl);
        }
      }
      if (this.logger) {
        this.logger.debug('app.js routing to path complete', originalPath);
      } else {
        console.log('app.js routing to path complete', originalPath);
      }
    },
    getLocalToken: function () {
      var authToken = localStorage.authToken;
      this.logger.debug('AUTH TOKEN:' + authToken);
      return authToken;
    },
    getHttpConfig: function () {
      return { headers: { 'X-Auth-Token': this.getLocalToken() } };
    },
    getAuthenticateHttpConfig: function () {
      return { ignoreAuthModule: true };
    },
    configUpdateFunction: function (config) {
      if (!config.headers['X-Auth-Token']) {
        console.log('X-Auth-Token not on original request; adding it');
        config.headers['X-Auth-Token'] = this.getLocalToken();
      }
      return config;
    }  //<<<<<<<<<<<< end FIXME::
  };
//bind this to AVaughanLogin
//_.bindAll(AVaughanLogin);
//define modules....
angular.module('avaughan.login', [
  'avaughan.logging',
  'ngResource',
  'ngCookies',
  'http-auth-interceptor'
]);
angular.module('avaughan.login').provider('avLogin', [
  '$httpProvider',
  function ($httpProvider) {
    var avaughanLogin = _.extend(AVaughanLogin, {});
    this.initialize = function (loginConfig) {
      console.log('avaughan.login initialize called', loginConfig);
      avaughanLogin.construct(loginConfig);
    };
    this.$get = [
      'authService',
      'avLog',
      '$rootScope',
      function (authService, avLog, $rootScope) {
        console.log('avaughan.login get called', authService);
        avaughanLogin.interceptHttpRequests($httpProvider);
        avaughanLogin.initialize(authService, avLog, $rootScope);
        return avaughanLogin;
      }
    ];
  }
]);