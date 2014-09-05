var myApp = angular.module('myApp', ['avaughan.logging', 'ngResource', 'ngCookies', 'http-auth-interceptor', 'avaughan.login']);

/**
 * configure the logging infrastructure
 */
myApp.config(['avLogProvider', 'avLevel', 'avLoginProvider',
    function(avLogProvider, avLevel, avLoginProvider) {

        //configure logging
        var myLogConfig = {
            //set a default log level - this will be used if someone logs under a category that is not defined below
            loglevel: avLevel.DEBUG, //TRACE, DEBUG, INFO, WARN, ERROR
            //these are the configured channels for logging - each channel can have it's own threshold
            //only log statements above the threshould will be output to the underlying $log
            category: {
                testController: avLevel.DEBUG, //all logging from the 'testController' controller will only be logged if .warn or above
                AVaughanLogin: avLevel.DEBUG,
                AuthManager: avLevel.DEBUG
            }
        };
        console.log('provider', avLogProvider);
        AVaughanLogging.get(avLogProvider, myLogConfig);

        //initialize and override 'someProperty' as well as choose with AuthManager to use (should handle
        //whatever backend tokens are sent by the server session provider
        var loginConfig = AVaughanLoginConfigFactory.create({
            someProperty: 'new value'
        }, GrailsSpringSecurityRestAuthManager);

        //initilize login with our config...
        avLoginProvider.initialize(loginConfig);
    }
]);

// run blocks
myApp.run(['$rootScope', '$cookieStore', '$location', '$cookies', 'avLogin',
    function($rootScope, $cookieStore, $location, $cookies, avLogin) {
        /* Try getting valid user from cookie or go to login page */
        avLogin.checkRequest($location, $cookieStore, $cookies, $rootScope);
    }
]);
