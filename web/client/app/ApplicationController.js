(function() {

    var app = angular.module("carpool");

    app.controller("ApplicationController", function($rootScope, $scope, $http, $location, $route) {

        $scope.connectedDeviceName = null;

        $scope.nav = {
            visible: function() {
                return $location.path() != '/login';
            },
            isActive: function(nav) {
                return $route.current.nav && $route.current.nav.startsWith(nav);
            }
        };

        function showMessage(severity, msg, timeout) {
            $scope.messages = [];
            $scope.messages[severity] = msg;

            if (!angular.isUndefined(timeout)) {
                setTimeout(function() {
                    $rootScope.clearMessages();
                    $rootScope.$apply();
                }, timeout);
            }
        }

        $rootScope.showInfo = function(msg, timeout) {
            showMessage("info", msg, timeout);
        };

        $rootScope.showError = function(msg, timeout) {
            showMessage("error", msg, timeout);
        };

        $rootScope.clearMessages = function() {
            $scope.messages = [];
        };

    });

}());
