(function () {

    var app = angular.module("carpool");

    app.controller("ApplicationController", ["$rootScope", "$scope", "$http", "$location", "$route", "AuthService",
        function ($rootScope, $scope, $http, $location, $route, AuthService) {

            $scope.account = null;

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
                $scope.messages[severity] = msg;

                if (!angular.isUndefined(timeout)) {
                    setTimeout(function () {
                        $rootScope.clearMessages();
                        $rootScope.$apply();
                    }, timeout);
                }
            }

            $rootScope.showInfo = function (msg, timeout) {
                showMessage("info", msg, timeout);
            };

            $rootScope.showError = function (msg, timeout) {
                showMessage("error", msg, timeout);
            };

            $rootScope.clearMessages = function () {
                $scope.messages = [];
            };

            $rootScope.setAccount = function (account) {
                $scope.account = account;
            };

            $scope.isLoggedIn = function () {
                return angular.isObject($scope.account);
            };

            $scope.logout = function () {
                AuthService.logout().then(function(response) {
                    $scope.account = null;
                    $location.url("/");
                }, function (error) {
                    $rootScope.showError("An error occurred while logging out.");
                });
            }
        }]);

}());
