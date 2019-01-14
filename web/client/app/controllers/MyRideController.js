(function () {

    var app = angular.module("carpool");

    app.controller("MyRideController", ["$rootScope", "$scope", "$routeParams", "$timeout", "byteball", "socket", "LocationService", "MyRidesService",
        function ($rootScope, $scope, $routeParams, $timeout, byteball, socket, LocationService, MyRidesService) {

            const AUTO_COMPLETION_TIMEOUT = 10 * 1000; // 10 sec
            const AUTO_COMPLETION_COUNTDOWN = 50;
            const AUTO_COMPLETION_COUNTDOWN_TIMEOUT = AUTO_COMPLETION_TIMEOUT / AUTO_COMPLETION_COUNTDOWN;

            $scope.ride = {};
            $scope.reservations = [];
            $scope.totalCheckIns = 0;
            $scope.completedReservations = [];
            $scope.autoCompletionProgress = 0;

            let locationWatchId = 0;
            let autoCompletionTimer;

            function startAutoCompletion(ride, countdown) {
                if (countdown >= 0) {
                    $scope.autoCompletionProgress = 1 - (countdown / AUTO_COMPLETION_COUNTDOWN);
                    autoCompletionTimer = $timeout(startAutoCompletion, AUTO_COMPLETION_COUNTDOWN_TIMEOUT, true, ride, countdown - 1);
                } else {
                    angular.element('#rideAutoCompletion').modal('hide');
                    completeRide();
                }
            }

            function cancelCompletion() {
                if (autoCompletionTimer) {
                    $timeout.cancel(autoCompletionTimer);
                }
                angular.element('#rideAutoCompletion').modal('hide');
            }

            function trackRide(ride) {
                LocationService.clear(locationWatchId);

                locationWatchId = LocationService.watch(ride.dropoffLat, ride.dropoffLng, function(err) {
                    if (err) return console.error(err);

                    angular.element("#rideAutoCompletion").modal({
                        backdrop: "static"
                    });

                    startAutoCompletion(ride, AUTO_COMPLETION_COUNTDOWN);
                });

                $scope.$on('$routeChangeStart', function() {
                    LocationService.clear(locationWatchId);
                });
            }

            function fetchRide() {
                return MyRidesService.get($routeParams.id).then(function (ride) {
                    $scope.ride = ride;
                    if (ride.status === 'boarding') {
                        updateCheckInUrl("CHECKIN-" + ride.checkInCode);
                        trackRide(ride);
                    }
                    $scope.ride.oracleUnitUrl = byteball.explorerUrl(ride.oracleUnit);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch ride", 5000);
                    $scope.ride = {};
                });
            }

            function startBoarding() {
                return MyRidesService.board($routeParams.id).then(function (response) {
                    updateCheckInUrl(response.checkInCode);
                    $scope.ride.status = response.status;
                    trackRide($scope.ride);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to start boarding", 5000);
                });
            }

            function completeRide() {

                function complete(arrivalLocation) {
                    return MyRidesService.complete($routeParams.id, arrivalLocation).then(function (response) {
                        $scope.checkInUrl = null;
                        $scope.ride.status = response.status;
                        $scope.ride.completionScore = response.completionScore;
                    }, function (error) {
                        console.error(error);
                        $rootScope.showError("Failed to complete ride", 5000);
                    });
                }

                LocationService.clear(locationWatchId);

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        console.log(position.coords);
                        complete({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    }, function (error) {
                        if (error.code === error.PERMISSION_DENIED) {
                            $rootScope.showError("Please enable location tracking to complete the ride", 5000);
                        } else {
                            $rootScope.showWarning("Failed to acquire location, completing anyways", 5000);
                            complete({});
                        }
                        $rootScope.$apply(); // error messages don't seem to show up consistently without it
                        console.error(error.message);
                    }, {
                        maximumAge: 5000,
                        timeout: 60000,
                        enableHighAccuracy: false
                    });
                } else {
                    console.error("Geolocation API is not available");
                    complete({});
                }
            }

            function updateCheckInUrl(checkInCode) {
                const pairingCode = byteball.pairingCode(checkInCode);
                $scope.checkInUrl = byteball.pairingUrl(pairingCode);
                console.log(pairingCode);
            }

            function isCreated() {
                return $scope.ride.status === 'created';
            }

            function isBoarding() {
                return $scope.ride.status === 'boarding';
            }

            function isCompleted() {
                return $scope.ride.status === 'completed';
            }

            function checkedIn(reservation) {
                return reservation.status === "checkedin";
            }

            function completed(reservation) {
                return reservation.status === "completed";
            }

            function paid(reservation) {
                return reservation.paymentStatus === "received" || reservation.paymentStatus === "paid";
            }

            function fetchReservations() {
                return MyRidesService.listReservations($routeParams.id).then(function (response) {
                    $scope.reservations = response.reservations;

                    if (Array.isArray(response.reservations) && response.reservations.length > 0) {
                        const totalReservations = response.reservations.length;
                        const totalCheckIns = response.reservations.filter(checkedIn).length;
                        const paidCheckIns = response.reservations.filter(paid).length;

                        $scope.totalCheckIns = totalCheckIns;
                        $scope.paidCheckIns = paidCheckIns / totalReservations;
                        $scope.unpaidCheckIns = (totalCheckIns - paidCheckIns) / totalReservations;
                        $scope.completedReservations = response.reservations.filter(completed);
                    }
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch reservations", 5000);
                    $scope.reservations = [];
                });
            }

            socket.on("checkin", function(data) {
                console.log(data.device + " checked in");
                fetchReservations();
            });

            socket.on("paymentReceived", function(data) {
                console.log("Payment received for ride " + data.rideId);
                if (data.rideId === $scope.ride.id) {
                    fetchReservations();
                }
            });

            socket.on("rideCompleted", function(data) {
                console.log("Ride completed " + data.rideId);
                if (data.rideId === $scope.ride.id) {
                    fetchRide().then(fetchReservations());
                }
            });

            fetchRide().then(fetchReservations);

            $scope.startBoarding = startBoarding;
            $scope.cancelCompletion = cancelCompletion;
            $scope.completeRide = completeRide;
            $scope.isCreated = isCreated;
            $scope.isBoarding = isBoarding;
            $scope.isCompleted = isCompleted;
        }]);

})();
