(function () {

    var app = angular.module("carpool");

    app.controller("RidesController", ["$rootScope", "$scope", "$cookies", "RidesService", "MyReservationsService",
        function ($rootScope, $scope, $cookies, RidesService, MyReservationsService) {

            $scope.hideCreateRideForm = "true" === $cookies.get("preferences.hideCreateRideForm");
            $scope.createRideInProgress = false;
            $scope.myReservations = [];

            $scope.newRide = {
                minDeparture: new Date(),
                departureDate: new Date(),
                departureTime: new Date(),
                seats: 2
            };

            function fetchMyReservations() {
                return MyReservationsService.list().then(function (response) {
                    $scope.myReservations = response.reservations;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch reservations", 5000);
                });
            }

            function fetchRides() {
                return RidesService.list(0, 10).then(function (response) {
                    $scope.rides = response.rides;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch rides", 5000);
                });
            }

            function createRide() {
                $scope.createRideInProgress = true;

                var date = $scope.newRide.departureDate;
                var time = $scope.newRide.departureTime;

                var newRide = {};
                newRide.departure = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes()).getTime();
                newRide.seats = $scope.newRide.seats;
                newRide.pickupAddress = $scope.newRide.pickup;
                newRide.dropoffAddress = $scope.newRide.dropoff;
                newRide.pricePerSeat = 2000;

                RidesService.create(newRide).then(function (createdRide) {
                    $scope.createRideInProgress = false;
                    $scope.rides.splice(0, 0, createdRide);
                }, function (error) {
                    $scope.createRideInProgress = false;
                    console.error(error);
                    $rootScope.showError("Failed to create ride", 5000);
                });
            }

            function reserve(ride) {
                console.log("Reserving ride: " + ride);
                RidesService.reserve(ride.id).then(function (reservation) {
                    ride.reservationCount++;
                    $scope.myReservations.push(reservation);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to create ride", 5000);
                });
            }

            function isReserved(ride) {
                return $scope.myReservations.find(function(reservation) {
                    return reservation.rideId === ride.id;
                });
            }

            function toggleCreateRideForm(visible) {
                $scope.hideCreateRideForm = visible;
                $cookies.put("preferences.hideCreateRideForm", $scope.hideCreateRideForm);
            }

            if ($rootScope.isLoggedIn()) {
                fetchMyReservations().then(fetchRides);
            } else {
                fetchRides();
            }

            $scope.createRide = createRide;
            $scope.reserve = reserve;
            $scope.isReserved = isReserved;
            $scope.toggleCreateRideForm = toggleCreateRideForm;
        }]);

})();
