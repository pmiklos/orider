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

            }

            function toggleCreateRideForm(visible) {
                $scope.hideCreateRideForm = visible;
                $cookies.put("preferences.hideCreateRideForm", $scope.hideCreateRideForm);
            }

            $scope.createRide = createRide;
            $scope.toggleCreateRideForm = toggleCreateRideForm;
        }]);

})();
