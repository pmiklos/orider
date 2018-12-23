(function () {

    var app = angular.module("carpool");

    app.controller("CarpoolsController", ["$scope",
        function ($scope) {

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
        }]);

})();
