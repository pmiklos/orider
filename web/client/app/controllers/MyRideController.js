(function () {

    var app = angular.module("carpool");

    app.controller("MyRideController", ["$rootScope", "$scope", "$routeParams", "byteball", "socket", "MyRidesService",
        function ($rootScope, $scope, $routeParams, byteball, socket, MyRidesService) {

            $scope.ride = {};

            function fetchRide() {
                return MyRidesService.get($routeParams.id).then(function (response) {
                    $scope.ride = response;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch ride", 5000);
                });
            }

            function startBoarding() {
                return MyRidesService.board($routeParams.id).then(function (response) {
                    const checkInCode = byteball.pairingCode(response.checkInCode);
                    $scope.checkInUrl = byteball.pairingUrl(checkInCode);
                    console.log(checkInCode);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to start boarding", 5000);
                });
            }

            function fetchReservations() {
                return MyRidesService.listReservations($routeParams.id).then(function (response) {
                    $scope.reservations = response.reservations;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch reservations", 5000);
                });
            }
            socket.on("checkin", function(data) {
                console.log(data.device + " checked in");
                fetchReservations();
            });

            fetchRide().then(fetchReservations);

            $scope.startBoarding = startBoarding;
        }]);

})();
