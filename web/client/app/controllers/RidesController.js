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
            $scope.unit = MB;
            $scope.minPrice = MIN_PRICE / $scope.unit;
            $scope.maxPrice = MAX_PRICE / $scope.unit;
            $scope.priceStep = 1 / $scope.unit;
            $scope.rides = [];
            $scope.page = 0;
            $scope.fetchSize = 10;
            $scope.fetchNoMore = false;

            $scope.newRide = {
                minDeparture: new Date(),
                departureDate: new Date(),
                departureTime: new Date(),
                seats: 2
            };

            function fetchRides() {
                return RidesService.list($scope.page * $scope.fetchSize, $scope.fetchSize).then(function (response) {
                    $scope.rides = $scope.rides.concat(response.rides);
                    if (response.rides.length === $scope.fetchSize) {
                        $scope.page++;
                    } else {
                        $scope.fetchNoMore = true;
                    }
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
                    ride.reservationDevices = [ride.reservationDevices, reservation.device].join(",");
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to create ride", 5000);
                });
            }

            function isReserved(ride) {
                return ride.reservationDevices && ride.reservationDevices.includes($rootScope.account.device);
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

            fetchRides();

            $scope.createRide = createRide;
            $scope.fetchRides = fetchRides;
            $scope.reserve = reserve;
            $scope.isReserved = isReserved;
            $scope.isMyRide = isMyRide;
            $scope.isBoarding = isBoarding;
            $scope.isCompleted = isCompleted;
            $scope.toggleCreateRideForm = toggleCreateRideForm;
        }]);

})();
