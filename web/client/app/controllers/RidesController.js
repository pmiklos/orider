(function () {

    var app = angular.module("carpool");

    app.controller("RidesController", ["$rootScope", "$scope", "$cookies", "RidesService",
        function ($rootScope, $scope, $cookies, RidesService) {

            $scope.hideCreateRideForm = "true" === $cookies.get("preferences.hideCreateRideForm");

            $scope.newRide = {
                minDeparture: new Date(),
                departureDate: new Date(),
                departureTime: new Date(),
                seats: 2
            };

            RidesService.list(0, 10).then(function (response) {
                $scope.rides = response.rides;
            }, function (error) {
                console.error(error);
                $rootScope.showError("Failed to fetch rides", 5000);
            });

            function createRide() {
                var date = $scope.newRide.departureDate;
                var time = $scope.newRide.departureTime;

                var newRide = {};
                newRide.departure = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes()).getTime();
                newRide.seats = $scope.newRide.seats;
                newRide.pickupAddress = $scope.newRide.pickup;
                newRide.dropoffAddress = $scope.newRide.dropoff;
                newRide.pricePerSeat = 2000;

                RidesService.create(newRide).then(function (createdRide) {
                    $scope.rides.splice(0, 0, createdRide);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to create ride", 5000);
                });
            }

            function toggleCreateRideForm(visible) {
                $scope.hideCreateRideForm = visible;
                $cookies.put("preferences.hideCreateRideForm", $scope.hideCreateRideForm);
            }

            $scope.createRide = createRide;
            $scope.toggleCreateRideForm = toggleCreateRideForm;
        }]);

})();
