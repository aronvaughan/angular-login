angular.module('myApp').controller('testController', ['$scope', 'avLog', '$rootScope', 'avLogin', '$resource', '$http', '$cookieStore',
    function($scope, avLog, $rootScope, avLogin, $resource, $http, $cookieStore) {

        var self = this;
        var logger = avLog.getLogger('testController');

        $scope.formData = {};
        $scope.loggedIn = false;
        $scope.userInfo = {};

        //create the angular $resource
        var resource = $resource('/api/userInfo', null, {});

        var getUserInfo = function() {
            logger.debug("get userInfo called");
            $scope.userInfo = resource.get({}, function(value, responseHeaders) {
                logger.debug(' get user info success: ' + value, value);
                if (value.username && !$scope.loggedIn) {
                    $scope.loggedIn = true;
                }

            });
            logger.debug("userinfo: ", $scope.userInfo);
            return $scope.userInfo;
        };

        $scope.isLoggedIn = function() {
            logger.debug("controller isLoggedIn called start", $scope.loggedIn);
            if (avLogin.isTokenAvailable($rootScope, $cookieStore) && !$scope.loggedIn) {
                console.log("isLogged in called, token is available but not logged in");
                $scope.loggedIn = true; //this is likely true.... but a call to a remote secure method or user check can double verify...
                if ($scope.userInfo === undefined || $scope.userInfo.name === undefined) {
                    getUserInfo();
                }
            }
            logger.debug("controller isLoggedIn called end", $scope.loggedIn);
            return $scope.loggedIn;
        };

        this.resetFormData = function() {
            logger.debug("resetFormData called");
            $scope.formData = {};
        };

        $scope.logout = function() {
            logger.debug("logout called");
            avLogin.logout($http, $cookieStore, $rootScope);
            $scope.loggedIn = false;
            $scope.userInfo = {};
            self.resetFormData();
            logger.debug("logout complete", [$scope.loggedIn, $scope.userInfo]);
        };

        $scope.login = function() {
            logger.debug("login called", $scope.formData);
            avLogin.login($scope.formData.name, $scope.formData.password, $http, $rootScope, $cookieStore);
        };

        $rootScope.$on('event:auth-loginConfirmed', function(event, user) {
            logger.info("event:auth-loginConfirmed got session login event ", event);
            logger.info("user data", user);
            $scope.userInfo = user;
            $scope.loggedIn = true;
        });

        $rootScope.$on('event:auth-logoutConfirmed', function(event, user) {
            logger.info("event:auth-logoutConfirmed got session logout event ", event);
            $scope.userInfo = {};
            $scope.loggedIn = false;
        });


        $scope.makeProtectedCall = function() {
            logger.debug("make protected call, called");
            var protectedCall = $resource('/api/protectedCall', null, {});
            var result = protectedCall.get({}, function(value, responseHeaders) {
                logger.debug(' protected call success: ' + value);
            }, function(httpResponse) {
                logger.error('failed protected call', httpResponse);
                $scope.result = httpResponse;
            });
            $scope.result = result;
        };

    }
]);
