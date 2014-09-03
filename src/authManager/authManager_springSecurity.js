'use strict';

/* jshint ignore:start */
var SpringSecurityAuthManager = {

    name: 'SpringSecurityAuthManager',

    useAuthTokenHeader: false,
    userUrlHeader: false,

    logger: undefined,

    getName: function() {
        return this.name;
    },

    setLog: function(avLog) {
        this.logger = avLog.getLogger('AuthManager');
    },

    setAuthOnRequest: function($rootScope, config) {
        var JSESSIONID = $rootScope.JSESSIONID;
        if (this.useAuthTokenHeader) {
            this.logger.debug('TOKEN_MANAGER, setting JSESSIONID header', JSESSIONID);
            config.headers['JSESSIONID'] = JSESSIONID;
        } else if (this.useUrlHeader) {
            this.logger.debug('use url token');
            config.url = config.url + '?jsessionid=' + JSESSIONID;
        }
    },

    isTokenAvailable: function($rootScope, $cookieStore) {
        this.load($cookieStore, $rootScope);
        return angular.isDefined($rootScope.JSESSIONID);
    },

    getTokenValues: function($rootScope) {
        return [$rootScope.JSESSIONID];
    },

    load: function($cookieStore, $rootScope) {
        var JSESSIONID;
        if ($cookieStore) {
            JSESSIONID = $cookieStore.get('JSESSIONID');
        } else {
            console.log('TOKEN_MANAGER: WARN $cookieStore is undefined');
        }
        if (JSESSIONID !== undefined) {
            console.log('TOKEN_MANAGER, load, got valid value from cookie', JSESSIONID);
            $rootScope.JSESSIONID = JSESSIONID;
        }
    },

    save: function(dataFromLoginPost, $rootScope, $cookieStore) {
        this.logger.debug('save, authentication token: ' + dataFromLoginPost.token, dataFromLoginPost);
        localStorage.JSESSIONID = dataFromLoginPost.token;
        $rootScope.JSESSIONID = dataFromLoginPost.token;
        $cookieStore.put('JSESSIONID', dataFromLoginPost.token);
        /*  $cookieStore('JSESSIONID', auth_hash.JSESSIONID);
         $cookieStore('grails_remember_me', auth_hash.JSESSIONID);
         $cookieStore('SessionProxyFilter_SessionId', auth_hash.JSESSIONID);   */
    },

    clear: function($cookieStore, $rootScope) {
        this.logger.debug('logout success, clearing tokens');
        localStorage.clear();
        $cookieStore.remove('JSESSIONID');
        //right?!
        $rootScope.JSESSIONID = undefined;
    },

    getLocalToken: function() {
        var authToken = localStorage.JSESSIONID;
        this.logger.debug('AUTH TOKEN:' + authToken);
        return authToken;
    },

    getHttpConfig: function() {
        return {
            headers: {
                'JSESSIONID': this.getLocalToken()
            }
        };
    },

    getAuthenticateHttpConfig: function() {
        return {
            ignoreAuthModule: true
        };
    },

    configUpdateFunction: function(config) {
        if (!config.headers['JSESSIONID']) {
            this.logger.debug('JSESSIONID not on original request; adding it');
            config.headers['JSESSIONID'] = this.getLocalToken();
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
