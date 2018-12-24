(function () {

    var app = angular.module("carpool");

    app.controller("RidesController", ["$scope", "$cookies",
        function ($scope, $cookies) {

            $scope.hideCreateRideForm = "true" === $cookies.get("preferences.hideCreateRideForm");

            $scope.newRide = {
                minDeparture: new Date(),
                departureDate: new Date(),
                departureTime: new Date(),
                seats: 2
            };

            $scope.rides = [{
                departure: 1288323623006,
                pickup: "1000NW Main Street, Oakland",
                dropoff: "304 2nd Street, San Francisco",
                seats: 3,
                driver: {
                    name: "Alice Cooper"
                },
                passengers: [
                    {
                        name: "Bob Geldof"
                    },
                    {
                        name: "Carlos Santana"
                    }
                ]
            }];

            function createRide() {
                var date = $scope.newRide.departureDate;
                var time = $scope.newRide.departureTime;

                var newRide = {
                    driver: {
                        name: "Alice Cooper"
                    },
                    passengers: []
                };
                newRide.departure = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());
                newRide.seats = $scope.newRide.seats;
                newRide.pickup = $scope.newRide.pickup;
                newRide.dropoff = $scope.newRide.dropoff;
                $scope.rides.push(newRide);
            }

            function toggleCreateRideForm(visible) {
                $scope.hideCreateRideForm = visible;
                $cookies.put("preferences.hideCreateRideForm", $scope.hideCreateRideForm);
            }

            $scope.createRide = createRide;
            $scope.toggleCreateRideForm = toggleCreateRideForm;
        }]);

})();
