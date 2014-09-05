'use strict';
/* jshint ignore:start */
var GrailsSpringSecurityRestAuthManager = {
    name: 'GrailsSpringSecurityRestAuthManager',
    useAuthTokenHeader: true,
    logger: undefined,
    getName: function () {
      return this.name;
    },
    setLog: function (avLog) {
      this.logger = avLog.getLogger('AuthManager');
    },
    setAuthOnRequest: function ($rootScope, config) {
      var authToken = $rootScope.authToken;
      if (this.useAuthTokenHeader) {
        this.logger.debug('TOKEN_MANAGER, setting X-Auth-Token header', authToken);
        config.headers['X-Auth-Token'] = authToken;
      } else {
        this.logger.debug('use url token');
        config.url = config.url + '?token=' + authToken;
      }
    },
    isTokenAvailable: function ($rootScope, $cookieStore, $cookies) {
      this.load($cookieStore, $rootScope);
      this.logger.debug('isTokenAvailable?', [
        $cookieStore,
        $rootScope.authToken
      ]);
      return angular.isDefined($rootScope.authToken);
    },
    getTokenValues: function ($rootScope) {
      return [$rootScope.authToken];
    },
    load: function ($cookieStore, $rootScope) {
      var authToken;
      if ($cookieStore) {
        authToken = $cookieStore.get('authToken');
      } else {
        console.log('TOKEN_MANAGER: WARN $cookieStore is undefined');
      }
      if (authToken !== undefined) {
        console.log('TOKEN_MANAGER, load, got valid value from cookie', authToken);
        $rootScope.authToken = authToken;
      }
    },
    save: function (dataFromLoginPost, $rootScope, $cookieStore, headers) {
      this.logger.debug('save, authentication token: ' + dataFromLoginPost.token, dataFromLoginPost);
      localStorage.authToken = dataFromLoginPost.token;
      $rootScope.authToken = dataFromLoginPost.token;
      $cookieStore.put('authToken', dataFromLoginPost.token);  /*  $cookieStore('JSESSIONID', auth_hash.JSESSIONID);
         $cookieStore('grails_remember_me', auth_hash.JSESSIONID);
         $cookieStore('SessionProxyFilter_SessionId', auth_hash.JSESSIONID);   */
    },
    clear: function ($cookieStore, $rootScope) {
      this.logger.debug('logout success, clearing tokens');
      localStorage.clear();
      $cookieStore.remove('authToken');
      //right?!
      $rootScope.authToken = undefined;
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
        this.logger.debug('X-Auth-Token not on original request; adding it');
        config.headers['X-Auth-Token'] = this.getLocalToken();
      }
      return config;
    }
  };  /* jshint ignore:end */
      /**
 * wires this token manager
 * @type {{name: string, useAuthTokenHeader: boolean, setTokenOnRequest: Function, isTokenAvailable: Function, getTokenValues: Function, transferCookieTokensToAngular: Function, persistTokens: Function, removeTokens: Function}}
 */
      //var AVaughanLoginAuthManager = GrailsSpringSecurityRestAuthManager;
      //GrailsSpringSecurityRestAuthManager.getName(); //avoid jshint unused warning
