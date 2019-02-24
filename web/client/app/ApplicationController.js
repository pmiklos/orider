(function () {

    var app = angular.module("carpool");

    app.controller("ApplicationController", ["$rootScope", "$scope", "$http", "$location", "$route", "$timeout", "AuthService",
        function ($rootScope, $scope, $http, $location, $route, $timeout, AuthService) {

            $rootScope.account = null;

            $scope.nav = {
                visible: function () {
                    return $location.path() != '/login';
                },
                isActive: function (nav) {
                    return $route.current.nav && $route.current.nav.startsWith(nav);
                }
            };

            function showMessage(severity, msg, timeout) {
                $scope.messages = [];

                if (typeof msg === "object") {
                    $scope.messages[severity] = msg;
                } else {
                    $scope.messages[severity] = {
                        text: msg
                    };
                }

                if (!angular.isUndefined(timeout)) {
                    $timeout(function () {
                        $rootScope.clearMessages();
                        $rootScope.$apply();
                    }, timeout);
                }
            }

            $rootScope.showInfo = function (msg, timeout) {
                showMessage("info", msg, timeout);
            };

            $rootScope.showWarning = function (msg, timeout) {
                showMessage("warn", msg, timeout);
            };

            $rootScope.showError = function (msg, timeout) {
                showMessage("error", msg, timeout);
            };

            $rootScope.clearMessages = function () {
                $scope.messages = [];
            };

            $rootScope.setAccount = function (account) {
                $rootScope.account = account;
            };

            $rootScope.isLoggedIn = function () {
                return angular.isObject($rootScope.account);
            };

            $rootScope.isAccountReady = function () {
                return angular.isObject($rootScope.account)
                    && angular.isString($rootScope.account.payoutAddress);
            };

            $rootScope.isAccountPending = function () {
                return !$rootScope.isAccountReady();
            };

            $scope.logout = function () {
                AuthService.logout().then(function(response) {
                    $rootScope.account = null;
                    $location.url("/");
                }, function (error) {
                    $rootScope.showError("An error occurred while logging out.");
                });
            }
        }]);

}());
