'use strict';
/*global angular:true, console:true, localStorage: true, AVaughanLoginAuthManager: true*/

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
    /**
     * how do we know what calls to intercept?  anything with this in it will
     * be intercepted and checked for login status and security tokens will
     * be placed on the request by the auth manager
     */
    restCallsWillContain: 'api',

    /**
     * where to post login form data
     */
    loginUrlForRemote: '/api/login',

    /**
     * what to post the username under to the remote login url
     */
    loginUserLabel: 'username',

    /**
     * what to post the password under to the remote login rul
     */
    loginPassLabel: 'password',

    /**
     * where to post for logout on remote server
     */
    logoutUrlForRemote: '/api/logout',

    /**
     * if the authentication token is not found - should we auto redirect?
     */
    redirectIfTokenNotFound: false,
    /**
     * if the authentication token is not found - and we should auto redirect, what url should we go to for login?
     */
    redirectIfTokenNotFoundUrl: '/login',

    /**
     * abstract token storage/retrieval so impl is pluggable
     */
    authManager: _.extend(AVaughanLoginAuthManager, {})

};

var AVaughanLogin = AVaughanLogin || {

    loginConfig: _.extend(AVaughanLoginConfig, {}),
    getAuthManager: function() {
        return this.loginConfig.authManager;
    },
    authService: undefined,
    logger: undefined,

    /**
     * configure the login module and setup to intercept requests
     *
     * @param $httpProvider
     * @param avaughanLoginConfig
     */
    construct: function(avaughanLoginConfig) {
        //this.logger.info('AVaughanLogin initialize called with config: ', [avaughanLoginConfig]);
        if (avaughanLoginConfig) {
            this.loginConfig = avaughanLoginConfig;
        }
    },

    initialize: function(authService, avLog) {
        this.logger = avLog.getLogger('AVaughanLogin');
        this.logger.debug('avaughan.login get called', authService);
        this.setAuthService(authService);

        this.getAuthManager().setLog(avLog);
    },

    interceptHttpRequests: function($httpProvider) {
        /**
         * register an interceptor to push auth tokens on the requests
         */
        $httpProvider.interceptors.push(this.getRequestInterceptor());
    },

    setAuthService: function(authService) {
        if (authService) {
            this.logger.debug('setting authService ', authService);
            this.authService = authService;
        }
    },

    login: function(username, password, $http, $rootScope, $cookieStore) {
        var postData = {};
        postData[this.loginConfig.loginUserLabel] = username;
        postData[this.loginConfig.loginPassLabel] = password;

        var self = this;
        $http.post(this.loginConfig.loginUrlForRemote, postData, this.getAuthenticateHttpConfig).
        success(function(data) {
            self.logger.info('Login successful for user: ', [username, data]);
            self.getAuthManager().save(data, $rootScope, $cookieStore);
            self.authService.loginConfirmed(data, self.configUpdateFunction);
        }).
        error(function(data) {
            self.logger.error('login error: ' + data);
            $rootScope.$broadcast('event:auth-loginFailed', data);
        });
    },

    logout: function($http, $cookieStore, $rootScope) {
        this.logger.debug('logout called');
        var self = this;
        $http.post(this.loginConfig.logoutUrlForRemote, {}, this.getHttpConfig()).
        success(function() {
            self.logger.info('Logout successful');
            self.getAuthManager().clear($cookieStore, $rootScope);
            //remove any user data
            $rootScope.$broadcast('event:auth-logoutConfirmed', '');
        }).
        error(function(data) {
            self.logger.error('logout error: ' + data);
        });
    },

    /**
     * you must wire this in your app config to intercept requests
     * Registers auth token interceptor, auth token is either passed by header or by query parameter
     * as soon as there is an authenticated user
     *
     * this puts the credentials on any REST calls to the server
     *
     * @returns {Function}
     */
    getRequestInterceptor: function($cookieStore) {
        if (this.logger) {
            this.logger.debug('get request interceptor called');
        } else {
            console.log('get request interceptor called');
        }

        var self = this;
        return function($q, $rootScope) {
            return {
                'request': function(config) {
                    self.logger.debug('avaughan.login request interceptor!!!!', [self.getAuthManager().getTokenValues($rootScope), config]);
                    var isRestCall = config.url.indexOf(self.loginConfig.restCallsWillContain) >= 0;
                    self.logger.debug('avaughan.login request is rest call?', [isRestCall, config.url]);
                    if (isRestCall && self.getAuthManager().isTokenAvailable($rootScope, $cookieStore)) {
                        self.getAuthManager().setAuthOnRequest($rootScope, config);
                    } else {
                        self.logger.debug('avaughan.login token is not available, or not rest call');
                    }
                    return config || $q.when(config);
                }
            };
        };
    },

    isTokenAvailable: function($rootScope, $cookieStore) {
        return this.getAuthManager().isTokenAvailable($rootScope, $cookieStore);
    },

    /**
     * Try getting valid user from cookie or go to login page
     * @param $location
     * @param $cookeStore
     */
    checkRequest: function($location, $cookieStore, $rootScope) {
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
                $location.path(this.loginConfig.redirectIfTokenNotFoundUrl);
            }
        }
    },

    //FIXME:>>>>>> move to token manager
    getLocalToken: function() {
        var authToken = localStorage.authToken;
        this.logger.debug('AUTH TOKEN:' + authToken);
        return authToken;
    },

    getHttpConfig: function() {
        return {
            headers: {
                'X-Auth-Token': this.getLocalToken()
            }
        };
    },

    getAuthenticateHttpConfig: function() {
        return {
            ignoreAuthModule: true
        };
    },

    configUpdateFunction: function(config) {
        if (!config.headers['X-Auth-Token']) {
            console.log('X-Auth-Token not on original request; adding it');
            config.headers['X-Auth-Token'] = this.getLocalToken();
        }
        return config;
    }
    //<<<<<<<<<<<< end FIXME::
};

//bind this to AVaughanLogin
//_.bindAll(AVaughanLogin);

//define modules....
angular.module('avaughan.login', ['avaughan.logging']);
angular.module('avaughan.login').provider('avLogin', ['$httpProvider',
    function avLoginProvider($httpProvider) {
        var avaughanLogin = _.extend(AVaughanLogin, {});
        avaughanLogin.interceptHttpRequests($httpProvider);

        this.initialize = function(loginConfig) {
            console.log('avaughan.login initialize called', loginConfig);
            avaughanLogin.construct(loginConfig);
        };

        this.$get = ['authService', 'avLog',
            function(authService, avLog) {
                console.log('avaughan.login get called', authService);
                avaughanLogin.initialize(authService, avLog);
                return avaughanLogin;
            }
        ];
    }
]);
