(function () {

    var app = angular.module("carpool");

    app.controller("LoginController", ["$rootScope", "$scope", "$route", "$location", "$timeout", "byteball", "socket", "AuthService", "AccountService", "DetectMobileBrowserService",
        function ($rootScope, $scope, $route, $location, $timeout, byteball, socket, AuthService, AccountService, DetectMobileBrowserService) {

            var pariringCode = byteball.pairingCode(AuthService.getAuthCode());

            function copyToClipboard(elementId) {
                var input = document.getElementById(elementId);
                input.select();
                var copied = document.execCommand("copy");
                if (copied) {
                    $rootScope.showInfo("Pairing code copied to clipboard", 2000);
                }
            }

            AuthService.getAuthToken().then(function (response) {
                socket.reconnect();
                document.getSelection().removeAllRanges();
                console.log("Logged in.");
                $location.url($rootScope.referrerUrl || "/");
                $rootScope.referrerUrl = null;
            }, function (error) {
                console.error("Authentication failed");
                $timeout(function () {
                    document.getSelection().removeAllRanges();
                    $route.reload();
                }, 5000);
            }).then(AccountService.resolve);

            $scope.pairingCode = pariringCode;
            $scope.pairingUrl = byteball.pairingUrl(pariringCode);
            $scope.mobile = DetectMobileBrowserService.isMobile();
            $scope.copyToClipboard = copyToClipboard;
        }]);

})();
