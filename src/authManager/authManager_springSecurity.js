'use strict';

/* jshint ignore:start */
var SpringSecurityAuthManager = {

    name: 'SpringSecurityAuthManager',

    useAuthTokenHeader: true,
    userUrlHeader: false,

    logger: undefined,

    tokenName: 'X-authtoken',

    getName: function() {
        return this.name;
    },

    setLog: function(avLog) {
        this.logger = avLog.getLogger('AuthManager');
    },

    getHeader: function($rootScope) {
        var headers = {};
        if (this.getTokenValues($rootScope)) {
            headers[this.tokenName] = this.getTokenValues($rootScope)[0];
        }
        return headers;
    },

    setAuthOnRequest: function($rootScope, config) {

        var sessionToken = $rootScope[this.tokenName];
        if (this.useAuthTokenHeader) {
            this.logger.debug('TOKEN_MANAGER, setting ' + this.tokenName + ' header', sessionToken);
            config.headers[this.tokenName] = sessionToken;
        } else if (this.useUrlHeader) {
            this.logger.debug('use url token');
            config.url = config.url + '?jsessionid=' + sessionToken;
        }
    },

    isTokenAvailable: function($rootScope, $cookieStore, $cookies) {
        this.logger.debug('isTokenAvailable?', $cookies);
        this.load($cookieStore, $rootScope);
        this.logger.debug('isTokenAvailable?', [$cookieStore, $rootScope[this.tokenName], angular.isDefined($rootScope[this.tokenName])]);
        return angular.isDefined($rootScope[this.tokenName]);
    },

    getTokenValues: function($rootScope) {
        return [$rootScope[this.tokenName]];
    },

    load: function($cookieStore, $rootScope) {
        this.logger.debug("[AuthManager] load, cookieStore", [$cookieStore, $cookieStore.get(this.tokenName)]);
        this.logger.debug('load - BROWSER COOKIES!!!', document.cookie);

        var sessionToken;
        if ($cookieStore) {
            sessionToken = $cookieStore.get(this.tokenName);
        } else {
            console.log('TOKEN_MANAGER: WARN $cookieStore is undefined, trying localstorage');
            sessionToken = localStorage[this.tokenName];
        }
        if (sessionToken !== undefined) {
            console.log('TOKEN_MANAGER, load, got valid value from cookie', sessionToken);
            $rootScope[this.tokenName] = sessionToken;
        } else {
            console.log('TOKEN_MANAGER, load, no valid value from cookie', sessionToken);
        }
    },

    save: function(dataFromLoginPost, $rootScope, $cookieStore, headers) {
        this.logger.debug('save, authentication token: ' + headers(this.tokenName));
        this.logger.debug('save - BROWSER COOKIES!!!', document.cookie);

        localStorage[this.tokenName] = headers(this.tokenName);
        $rootScope[this.tokenName] = headers(this.tokenName);
        $cookieStore.put(this.tokenName, headers(this.tokenName));

        /*  $cookieStore('JSESSIONID', auth_hash.JSESSIONID);
         $cookieStore('grails_remember_me', auth_hash.JSESSIONID);
         $cookieStore('SessionProxyFilter_SessionId', auth_hash.JSESSIONID);   */
    },

    clear: function($cookieStore, $rootScope) {
        this.logger.debug('logout success, clearing tokens');
        localStorage.clear();
        $cookieStore.remove(this.tokenName);
        //right?!
        $rootScope[this.tokenName] = undefined;
    },

    getLocalToken: function() {
        var authToken = localStorage[this.tokenName];
        this.logger.debug('AUTH TOKEN:' + authToken);
        return authToken;
    },

    getHttpConfig: function() {

        var headers = {};
        headers[this.tokenName] = this.getLocalToken();
        return headers;
    },

    getAuthenticateHttpConfig: function() {
        return {
            ignoreAuthModule: true
        };
    },

    configUpdateFunction: function(config) {
        if (!config.headers[this.tokenName]) {
            this.logger.debug(this.tokenName + ' not on original request; adding it');
            config.headers[this.tokenName] = this.getLocalToken();
        }
        return config;
    }

};
/* jshint ignore:end */
/**
 * wires this token manager
 * @type {{name: string, useAuthTokenHeader: boolean, setTokenOnRequest: Function, isTokenAvailable: Function, getTokenValues: Function, transferCookieTokensToAngular: Function, persistTokens: Function, removeTokens: Function}}
 */
//var AVaughanLoginAuthManager = GrailsSpringSecurityRestAuthManager;
//GrailsSpringSecurityRestAuthManager.getName(); //avoid jshint unused warning
