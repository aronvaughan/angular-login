'use strict';
/*global angular:true, console:true*/
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
    postType: 'JSON',
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
    toLogin: function ($location) {
      $location.path(this.loginConfig.redirectIfTokenNotFoundUrl);
    },
    parseUri: function (str) {
      var o = this.parseUriOptions, m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str), uri = {}, i = 14;
      while (i--)
        uri[o.key[i]] = m[i] || '';
      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1)
          uri[o.q.name][$1] = $2;
      });
      return uri;
    },
    parseUriOptions: {
      strictMode: false,
      key: [
        'source',
        'protocol',
        'authority',
        'userInfo',
        'user',
        'password',
        'host',
        'port',
        'relative',
        'path',
        'directory',
        'file',
        'query',
        'anchor'
      ],
      q: {
        name: 'queryKey',
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
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
      var self = this;
      var headers = { 'Content-Type': 'application/json' };
      var postData = {};
      postData[this.loginConfig.loginUserLabel] = username;
      postData[this.loginConfig.loginPassLabel] = password;
      //var postData = 'username=CharlesOwen&password=charlesowen';
      if (this.loginConfig.postType === 'FORM') {
        headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        postData = this.loginConfig.loginUserLabel + '=' + username + '&' + this.loginConfig.loginPassLabel + '=' + password;
      }
      this.logger.debug('Post type: ' + this.loginConfig.postType + 'value: ', postData);
      $http({
        method: 'POST',
        url: this.loginConfig.loginUrlForRemote,
        data: postData,
        headers: headers,
        ignoreAuthModule: true,
        withCredentials: true
      }).success(function (data, status, headers, config) {
        self.logger.info('Login successful for user: ', [
          username,
          data,
          status,
          headers,
          config,
          self.loginConfig
        ]);
        self.getAuthManager().save(data, $rootScope, $cookieStore, headers);
        self.authService.loginConfirmed(data, self.configUpdateFunction);
        if (self.loginConfig.redirectAfterLogin) {
          var url = $location.$$absUrl;
          self.logger.info('should redirect after login', [
            $location,
            url
          ]);
          if (url.indexOf('originalUrl=') > -1) {
            var originalUrl = self.parseUri(url);
            var forwardToEncoded = originalUrl.queryKey.originalUrl;
            var urlToGoTo = decodeURIComponent(forwardToEncoded);
            self.logger.info('original url found', urlToGoTo);
            $location.search('originalUrl', null);
            $location.url(urlToGoTo);
          } else {
            self.logger.info('using default url to redirect after login', $location.path().originalUrl);
            $location.path(self.loginConfig.defaultUrlAfterLogin);
          }
        }
      }).error(function (data, status, headers, config) {
        self.logger.error('login error: ', data, status, headers, config);
        self.loginFailed(data);
      });
    },
    loginConfirmed: function (user) {
      this.logger.info('loginConfirmed', user);
      this.authService.loginConfirmed(user, this.loginConfig.configUpdateFunction);
    },
    loginFailed: function (rejection) {
      this.logger.warn('broadcasting login failed: ');
      this.$rootScope.$broadcast('event:auth-loginFailed', rejection);
    },
    logout: function ($http, $cookieStore, $rootScope) {
      this.logger.debug('logout called');
      var self = this;
      $http.post(this.loginConfig.logoutUrlForRemote, {}, this.loginConfig.getHttpConfig).success(function () {
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
              console.log('requestInterceptor - BROWSER COOKIES!!!', document.cookie);
              if (self.logger) {
                self.logger.debug('avaughan.login request interceptor - request!!!!', [
                  self.getAuthManager().getTokenValues($rootScope),
                  config
                ]);
              }
              var isRestCall = config.url.indexOf(self.loginConfig.restCallsWillContain) >= 0;
              if (self.logger) {
                self.logger.debug('avaughan.login request is rest call?', [
                  isRestCall,
                  config.url
                ]);
              }
              if (isRestCall && self.getAuthManager().isTokenAvailable($rootScope, $cookieStore)) {
                self.getAuthManager().setAuthOnRequest($rootScope, config);
              } else {
                if (self.logger) {
                  self.logger.debug('avaughan.login token is not available, or not rest call', config.url);
                }
              }
              return config || $q.when(config);
            },
            'responseError': function (rejection) {
              self.logger.info('avaughan.login request interceptor - responseError', rejection);
              self.loginFailed(rejection);
              if (rejection.status === 403 && self.loginConfig.redirectIfTokenNotFound) {
                self.logger.info('got 403 and configured to redirect', self.loginConfig.redirectIfTokenNotFoundUrl);
                $location.search('originalUrl', $location.path());
                $location.path(self.loginConfig.redirectIfTokenNotFoundUrl);
              }
              return $q.reject(rejection);
            },
            'response': function (response) {
              if (self.logger) {
                self.logger.debug('avaughan.login request interceptor - response', response);
              }
              console.log('BROWSER COOKIES!!!', document.cookie);
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
    checkRequest: function ($location, $cookieStore, $cookies, $rootScope, $http) {
      /* Try getting valid user from cookie or go to login page */
      var originalPath = $location.path();
      this.getAuthManager().load($cookieStore, $rootScope);
      if (this.getAuthManager().isTokenAvailable($rootScope, $cookieStore, $cookies) && this.getAuthManager().isTokenValid($http, $rootScope, $cookieStore)) {
        if (this.logger) {
          this.logger.debug('app.js routing to path', originalPath);
        } else {
          console.log('[avLogin] checkRequest - app.js routing to path', originalPath);
        }
        $location.path(originalPath);
      } else {
        if (this.loginConfig.redirectIfTokenNotFound) {
          if (this.logger) {
            this.logger.debug('not authorized, routing', this.loginConfig.redirectIfTokenNotFoundUrl);
          } else {
            console.log('not authorized, routing', this.loginConfig.redirectIfTokenNotFoundUrl);
          }
          console.log('[avLogin] checkRequest - location.path ', $location.path(), this.loginConfig.redirectIfTokenNotFoundUrl);
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
    }
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
        avaughanLogin.initialize(authService, avLog, $rootScope);
        avaughanLogin.interceptHttpRequests($httpProvider);
        return avaughanLogin;
      }
    ];
  }
]);