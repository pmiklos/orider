(function () {

    var app = angular.module("carpool");

    app.factory("MyReservationsService", ["$q", "$http", function ($q, $http) {
        return {
            complete: function (rideId, arrivalLocation) {
                return $http.post(`/api/my/reservations/${rideId}/complete`, arrivalLocation).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error(errorResponse);
                    return $q.reject({status: "error"});
                });
            },
            get: function (rideId) {
                return $http.get(`/api/my/reservations/${rideId}`).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error(errorResponse);
                    return $q.reject({status: "error"});
                });
            },
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
