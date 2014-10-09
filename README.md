# angular-login

angular lib that wraps the excellent 'http-auth-interceptor' library to provide a config based login. Angular-login
also provides a pluggable 'token manager' implementation (with a Grails Spring Security REST impl) so that getting more
backend session impls online is easy to do

## Getting Started

Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/aronvaughan/angular-login/master/dist/angular-login.min.js
[max]: https://raw.github.com/aronvaughan/angular-login/master/dist/angular-login.js

1. Include the `angular-login.js` script provided by this component into your app's webpage.  as well as the necessary dependant libraries

In your web page:

```html
   <script src="../../bower_components/angular/angular.js"></script>
   <script src="../../bower_components/angular-cookies/angular-cookies.js"></script>
   <script src="../../bower_components/angular-logging/dist/angular-logging.min.js"></script>
   <script src="../../bower_components/lodash/dist/lodash.compat.js"></script>
   <script src="../../bower_components/angular-resource/angular-resource.js"></script>
   <script src="../../bower_components/angular-http-auth/src/http-auth-interceptor.js"></script>
   <!-- endbower -->
   <!-- endbuild -->

   <!-- build:js scripts/app.min.js -->

   <!-- to use the non-minified versions -->
   <script src="../authManager/authManager_grailsSpringSecurityRest.js"></script>
   <script src="../angular-login.js"></script>

   <!-- to use the minified version (the auth managers have been concatenated with the main file -->
   <script src="../<path>/angular-login.min.js
```
this project depends on lodash or underscore, angular-logging, angular, angular-resource, angular-cookies, and http-auth-interceptor .js libraries

currently there is only 1 token manager (works with grails spring security rest plugin) - include that or your custom
authManager before including angular-login-service.js

2. In the run block of your application, check the initial request for auth

```js
// run blocks
myApp.run(['$rootScope', '$cookieStore', '$location', '$cookies', 'avLogin',
    function($rootScope, $cookieStore, $location, $cookies, avLogin) {
        /* Try getting valid user from cookie or go to login page */
        avLogin.checkRequest($location, $cookieStore, $cookies, $rootScope);
    }
]);
```

3. Login: In your controller where you handle login, use the new login functionality

```js
angular.module('myApp').controller('testController', ['$scope', 'avLog', '$rootScope', 'avLogin', '$resource', '$http', '$cookieStore', '$location',
    function($scope, avLog, $rootScope, avLogin, $resource, $http, $cookieStore, $location) {

       $scope.login = function() {
            avLogin.login($scope.formData.name, $scope.formData.password, $http, $rootScope, $cookieStore, $location);
        };

}
```

```html
 <form ng-cloak class="form-signin ng-cloak" role="form" ng-submit="login()">
    <h2 ng-cloak class="form-signin-heading">Please sign in</h2>
       <input ng-cloak type="text"  name='j_username' id='username' class="form-control" placeholder="User Name" required autofocus ng-model="formData.name">
       <input ng-cloak type="password" name='j_password' id='password' class="form-control" placeholder="Password" required ng-model="formData.password">
       <button ng-cloak class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
 </form>
```

If your login function returns a user - you can receive the resolved user as an event

```js
$rootScope.$on('event:auth-loginConfirmed', function(event, user) {
            logger.info("event:auth-loginConfirmed got session login event ", event);
            logger.info("user data", user);
            /etc....
});
```

4. Logout: In your controller where you handle logout, use the new functionality

```js
$scope.logout = function() {
   avLogin.logout($http, $cookieStore, $rootScope);
};
```

If you have race conditions - you can do any 'clearing' logic after the logout has been processed, by an event

```js
$rootScope.$on('event:auth-logoutConfirmed', function(event, user) {
            logger.info("event:auth-logoutConfirmed got session logout event ", event);
            $scope.userInfo = {};
            $scope.loggedIn = false;
});
```

1. Events

Events are broadcasted on $rootScope

|  Name | params |  Description |
| event:auth-loginConfirmed | event - TODO, user - the user returned from the remote login call | called on login  |
| event:auth-logoutConfirmed | event - TODO | called on logout |
| event:auth-logoutFailed | rejection - any data about the failure that we have | called when the login fails (bad username, pass, etc..) |
| event:auth-loginRequired | event | called when the interceptor detects that login is needed, if you specify 'redirectIfTokenNotFound' and a url then you don't need this event |


5. Ajax token handling

every api request to the service will call the auth manager to set the appropriate auth headers on the request to the
server.  Also, any cookies/session info in the response can be saved locally by the auth manager - this guarantees
session handling and continuity

6. Configuration settings

```js
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
     * do we redirect after login?
     */
    redirectAfterLogin: false,

    /**
     * where do we go after login  if we should redirect after login?
     */
    defaultUrlAfterLogin: '/',

    /**
     * do we do form encoding or json object posting?
     */
    postType: 'JSON', //alternate is FORM

};
```

To override these settings

```js
/**
 * configure the login infrastructure
 */
myApp.config(function(avLoginProvider) {

     //initialize and override 'someProperty' as well as choose with AuthManager to use (should handle
     //whatever backend tokens are sent by the server session provider
     var loginConfig = AVaughanLoginConfigFactory.create({
            someProperty: 'new value'
        }, GrailsSpringSecurityRestAuthManager);

     //initilize login with our config...
     avLoginProvider.initialize(loginConfig);

});
```

## Documentation

## Examples
See getting started
See also tests in this github project
See example in source code

## Changelog

### v 0.0.1

* initial release

### v 0.0.4

* handle login error with 401 response, broadcast failure event on login failure on $rootScope

### v 0.0.5

* allow for redirect after login (and go to original url afterwards)
* add default 'after login' and flag to re-route after login if no original url is found
* if false, no interception happens

### v 0.0.6 - DO NOT USE

* added Spring Security Auth Manager - see app2.js in this code to use:

```Example
        var loginConfig = AVaughanLoginConfigFactory.create({
            someProperty: 'new value',
            postType: 'FORM'
        }, SpringSecurityAuthManager);
```

### v 0.0.7 - fixed bug in 0.0.6 handling for form posting/spring security

### v 0.0.8 - moved the spring security to use a token based header vs. a cookie (older versions of grails do not honor the httpOnly config or 'withCredentials'
you will need to do the following (this example in grails)

```Server side Token Filter
/**
 * Filter that writes the session token to a header
 * the correct fix is to modify the system to not set the httpOnly header on the JSESSIONID - our version
 * of grails does not honor the servlet spec setting and config
 *
 * User: aronvaughan
 * Date: 9/4/14
 * To change this template use File | Settings | File Templates.
 */
class SessionTokenFilter extends GenericFilterBean {

    private static final Logger log = Logger.getLogger(SessionTokenFilter.class);

    public final static String HEADER_NAME = "X-authtoken"

    @Override
    void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest servletRequest = request

        log.debug "Looking for session in request...${servletRequest.cookies}"
        String tokenValue
        servletRequest.cookies.each {
            log.debug "${it.name} == ${it.value} "
            if (it.name.equals("JSESSIONID")) {
                log.debug(" found JSESSIONID ${it.value}")
                tokenValue = it.value
            }
        }

        if (tokenValue) {
            log.debug "Token found: ${tokenValue}"

            HttpServletResponse servletResponse = response
            def c = new Cookie(HEADER_NAME, tokenValue)
            c.maxAge = SystemSettings.getCurrentSettings().getSessionTimeout() * 60;
            servletResponse.addCookie(c)

            servletResponse.addHeader(HEADER_NAME, tokenValue)
        } else {
            log.debug "Token not found"
        }
        chain.doFilter(request, response)

    }
}
```

```resource.groovy - wire the bean in spring
    sessionTokenFilter(SessionTokenFilter) {

    }
```

```Bootstrap.groovy - wire the filter
 def init = { servletContext ->
    SpringSecurityUtils.clientRegisterFilter 'sessionTokenFilter', SecurityFilterPosition.ANONYMOUS_FILTER.order + 1
 }
 ```

### 0.0.9

Add toLogin($location) {} method to allow callers to force a login screen call - redirectIfTokenNotFoundUrl must be defined

### 0.0.10

add getHeader() method to auth manager (can be used to also configure non angular calls - i.e. dropzone headers)

### 0.0.11

allow json token name to be specified for spring rest security - default to 'access_token' to match latest grails side release
if you aren't getting the cookie value set, look here (and check the login response from the service, the json return value token name should match)

### 0.0.12

auth managers expose isTokenValid method - if you are using grails REST spring security will call the
 validate token endpoint (requires, 1.4.0.RC5+ of the grails rest spring security plugin). If the token is invlid
 it removes it from the browser (this allows turning on anonymous access - if you send an invalid token
 the backend will send a 403 regardless if the resources is setp to allow access to all)

because of this checkRequest now takes a $http parameter

``` app.js - when configuring the run.app section
// run blocks
myApp.run(['$rootScope', '$cookieStore', '$location', '$cookies', 'avLogin', '$http',
    function($rootScope, $cookieStore, $location, $cookies, avLogin, $http) {
        /* Try getting valid user from cookie or go to login page */
        avLogin.checkRequest($location, $cookieStore, $cookies, $rootScope, $http);
    }
]);
```


## TODO

* figure out integration tests (angular only allows unit or functional)

## Resources

the provided token manager

* http://alvarosanchez.github.io/grails-spring-security-rest/docs/guide/introduction.html

the angular-http-auth library that this code is built upon

* https://github.com/witoldsz/angular-http-auth

initial grunt workspace generated by angular-component

* http://stackoverflow.com/questions/19614545/how-can-i-add-some-small-utility-functions-to-my-angularjs-application
* http://stackoverflow.com/questions/15666048/angular-js-service-vs-provider-vs-factory
* http://briantford.com/blog/angular-bower

## Contributing

download the full source....

1. install npm and grunt
2. cd to root of project checkout

to test

1. grunt test

to see the example app

1. grunt serve
2. make sure you have developer tools/firebug, etc.. open so you can see console logs


## To Release
1. grunt build
2. add release notes in README.md
2. commit files
3. grunt release (will commit files and bump bower versions)
