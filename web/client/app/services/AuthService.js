(function () {

    var app = angular.module("carpool");

    app.factory('AuthService', ["$q", "$http", "CONFIG", function ($q, $http, config) {
        var authCode = "";

        return {
            resolve: function () {
                return $http.post("/api/auth/init").then(function (response) {
                    authCode = response.data.authCode;
                }, function (error) {
                    console.error("Failed to get auth code: " + error);
                });
            },

            getAuthCode: function () {
                return authCode;
            },

            getAuthToken: function () {
                return $http.post("/api/auth/token", {
                    authCode: authCode
                }, {
                    timeout: config.authTimeout
                }).then(function (response) {
                    return response.data;
                }, function (error) {
                    if (error.xhrStatus === "complete") {
                        console.error("Failed to get auth token. HTTP " + error.status);
                        return $q.reject((error.status === 408) ? {status: "timeout"} : {status: "error"});
                    } else {
                        console.error("Failed to get auth token: Timeout");
                        return $q.reject({status: "timeout"});
                    }
                });
            }
        };
    }]);

}());
