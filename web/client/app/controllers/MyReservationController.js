(function () {

    var app = angular.module("carpool");

    app.controller("MyReservationController", ["$rootScope", "$scope", "$routeParams", "byteball", "socket", "MyReservationsService", "RidesService", "DetectMobileBrowserService",
        function ($rootScope, $scope, $routeParams, byteball, socket, MyReservationsService, RidesService, DetectMobileBrowserService) {

            $scope.reservation = {};
            $scope.ride = {};
            $scope.mobile = DetectMobileBrowserService.isMobile();
            $scope.contactDriverUrl = byteball.pairingUrl(byteball.pairingCode(`CONTACT-${$routeParams.id}`));

            function fetchMyReservation() {
                return MyReservationsService.get($routeParams.id).then(function (reservation) {
                    $scope.reservation = reservation;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch reservations", 5000);
                });
            }

            function fetchRide() {
                return RidesService.get($routeParams.id).then(function (ride) {
                    $scope.ride = ride;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch ride", 5000);
                });
            }

            function completeRide() {

                function complete(arrivalLocation) {
                    return MyReservationsService.complete($routeParams.id, arrivalLocation).then(function (response) {
                        $scope.reservation.status = response.status;
                        $scope.reservation.completionScore = response.completionScore;
                    }, function (error) {
                        console.error(error);
                        $rootScope.showError("Failed to complete reservations", 5000);
                    });
                }


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

            function isRideBoarding() {
                return $scope.ride.status === 'boarding';
            }

            function isReserved() {
                return $scope.reservation.status === 'reserved';
            }

            function isCheckedIn() {
                return $scope.reservation.status === 'checkedin';
            }

            function isCompleted() {
                return $scope.reservation.status === 'completed';
            }

            function contactDriver() {
                MyReservationsService.contact($routeParams.id).then(function (response) {
                    $rootScope.showInfo("Contact details were sent to your wallet.", 3000);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Cannot contact driver.", 3000);
                });
            }

            fetchMyReservation().then(fetchRide());

            $scope.isReserved = isReserved;
            $scope.isCheckedIn = isCheckedIn;
            $scope.isCompleted = isCompleted;
            $scope.isRideBoarding = isRideBoarding;
            $scope.completeRide = completeRide;
            $scope.contactDriver = contactDriver;
        }]);

})();
