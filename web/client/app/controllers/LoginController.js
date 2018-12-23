(function () {

    var app = angular.module("carpool");

    app.controller("LoginController", ["$scope", "$route", "$location", "$timeout", "byteball", "socket", "AuthService",
        function ($scope, $route, $location, $timeout, byteball, socket, AuthService) {

            var pariringCode = byteball.pairingCode(AuthService.getAuthCode());

            AuthService.getAuthToken().then(function (response) {
                socket.reconnect();
                document.getSelection().removeAllRanges();
                console.log("Logged in.");
                $location.url("/");
            }, function (error) {
                console.error("Authentication failed");
                $timeout(function () {
                    document.getSelection().removeAllRanges();
                    $route.reload();
                }, 5000);
            });

            $scope.pairingCode = pariringCode;
            $scope.pairingUrl = byteball.pairingUrl(pariringCode);
        }]);

})();
