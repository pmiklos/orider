(function () {

    var app = angular.module("carpool");

    app.controller("MyRideController", ["$rootScope", "$scope", "$routeParams", "byteball", "socket", "MyRidesService",
        function ($rootScope, $scope, $routeParams, byteball, socket, MyRidesService) {

            $scope.ride = {};

            function fetchRide() {
                return MyRidesService.get($routeParams.id).then(function (ride) {
                    $scope.ride = ride;
                    if (ride.status === 'boarding') {
                        updateCheckInUrl(ride.checkInCode);
                    }
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch ride", 5000);
                });
            }

            function startBoarding() {
                return MyRidesService.board($routeParams.id).then(function (response) {
                    updateCheckInUrl(response.checkInCode);
                    $scope.ride.status = response.status;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to start boarding", 5000);
                });
            }

            function completeRide() {
                return MyRidesService.complete($routeParams.id).then(function (response) {
                    $scope.checkInUrl = null;
                    $scope.ride.status = response.status;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to complete ride", 5000);
                });
            }

            function updateCheckInUrl(checkInCode) {
                const pairingCode = byteball.pairingCode(checkInCode);
                $scope.checkInUrl = byteball.pairingUrl(pairingCode);
                console.log(pairingCode);
            }

            function isBoarding() {
                return $scope.ride.status === 'boarding';
            }

            function isCompleted() {
                return $scope.ride.status === 'completed';
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
            $scope.completeRide = completeRide;
            $scope.isBoarding = isBoarding;
            $scope.isCompleted = isCompleted;
        }]);

})();
