var myApp = angular.module('myApp', ['avaughan.logging', 'ngResource', 'ngCookies', 'http-auth-interceptor', 'avaughan.login']);

/**
 * configure the logging infrastructure
 */
myApp.config(function(avLogProvider, avLevel, avLoginProvider) {

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

    //optional...override config values....
    var loginConfig = _.extend(AVaughanLoginConfig, {
        someProperty: 'new value'
    });
    avLoginProvider.initialize(loginConfig);

});

// run blocks
myApp.run(['$rootScope', '$cookieStore', '$location', 'avLogin',
    function($rootScope, $cookieStore, $location, avLogin) {
        /* Try getting valid user from cookie or go to login page */
        avLogin.checkRequest($location, $cookieStore, $rootScope);
    }
]);
