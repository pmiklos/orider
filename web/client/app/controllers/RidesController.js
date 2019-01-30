(function () {

    var app = angular.module("carpool");

    app.controller("RidesController", ["$rootScope", "$scope", "$cookies", "RidesService", "MyReservationsService",
        function ($rootScope, $scope, $cookies, RidesService, MyReservationsService) {

            const byte = 1;
            const KB = byte * 1000;
            const MB = KB * 1000;
            const GB = MB * 1000;
            const MIN_PRICE = 5 * KB;
            const MAX_PRICE = 5 * GB;

            $scope.hideCreateRideForm = "true" === $cookies.get("preferences.hideCreateRideForm");
            $scope.createRideInProgress = false;
            $scope.myReservations = [];
            $scope.unit = MB;
            $scope.minPrice = MIN_PRICE / $scope.unit;
            $scope.maxPrice = MAX_PRICE / $scope.unit;
            $scope.priceStep = 1 / $scope.unit;

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
                newRide.departure = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), time.getUTCHours(), time.getUTCMinutes());
                newRide.seats = $scope.newRide.seats;
                newRide.pickupAddress = $scope.newRide.pickup;
                newRide.dropoffAddress = $scope.newRide.dropoff;
                newRide.pricePerSeat = Math.floor($scope.newRide.pricePerSeat * $scope.unit);

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

            function isBoarding(ride) {
                return ride.status === 'boarding';
            }

            function isCompleted(ride) {
                return ride.status === 'completed';
            }

            function isMyRide(ride) {
                return ride.device === $rootScope.account.device;
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
            $scope.isMyRide = isMyRide;
            $scope.isBoarding = isBoarding;
            $scope.isCompleted = isCompleted;
            $scope.toggleCreateRideForm = toggleCreateRideForm;
        }]);

})();
