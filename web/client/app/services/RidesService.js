(function () {

    var app = angular.module("carpool");

    app.factory("RidesService", ["$q", "$http", function ($q, $http) {
        return {
            create: function (ride) {
                return $http.post("/api/rides", ride).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to create ride: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            },
            list: function (from, size) {
                return $http.get(`/api/rides?from=${from}&size=${size}`).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to fetch rides: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            }
        };
    }]);

}());
