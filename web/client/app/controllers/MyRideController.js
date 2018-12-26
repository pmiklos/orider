(function () {

    var app = angular.module("carpool");

    app.controller("MyRideController", ["$rootScope", "$scope", "$routeParams", "MyRidesService",
        function ($rootScope, $scope, $routeParams, MyRidesService) {

            $scope.ride = {};

            function fetchRide() {
                return MyRidesService.get($routeParams.id).then(function (response) {
                    $scope.ride = response;
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to fetch ride", 5000);
                });
            }

            fetchRide();
        }]);

})();
