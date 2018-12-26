(function () {

    var app = angular.module("carpool");

    app.factory("MyReservationsService", ["$q", "$http", function ($q, $http) {
        return {
            list: function () {
                return $http.get("/api/my/reservations").then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to fetch reservations: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            }
        };
    }]);

}());
