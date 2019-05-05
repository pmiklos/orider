(function () {

    var app = angular.module("carpool");

    app.factory("MyRidesService", ["$q", "$http", function ($q, $http) {
        return {
            board: function(id) {
                return $http.post(`/api/my/rides/${id}/board`).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to start boarding: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            },
            complete: function(id, arrivalLocation) {
                return $http.post(`/api/my/rides/${id}/complete`, arrivalLocation).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to complete ride: " + JSON.stringify(errorResponse));
                    return $q.reject({status: "error"});
                });
            },
            contact: function (id) {
                return $http.post(`/api/my/rides/${id}/contact`, {}).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error(errorResponse);
                    return $q.reject({status: "error"});
                });
            },
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
            },
            listReservations: function (id) {
                return $http.get(`/api/my/rides/${id}/reservations`).then(function (response) {
                    return response.data;
                }, function (errorResponse) {
                    console.error("Failed to fetch reservations: " + errorResponse);
                    return $q.reject({status: "error"});
                });
            }
        };
    }]);

}());
