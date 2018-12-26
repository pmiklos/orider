(function () {

    var app = angular.module("carpool");

    app.factory("MyRidesService", ["$q", "$http", function ($q, $http) {
        return {
            get: function (id) {
                return $http.get(`/api/my/rides/${id}`).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to fetch ride: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            },
            list: function () {
                return $http.get(`/api/my/rides`).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to fetch rides: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            }
        };
    }]);

}());
