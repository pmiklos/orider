(function() {

    var app = angular.module("carpool");

    app.factory("AccountService", ["$q", "$rootScope", "$http", function($q, $rootScope, $http) {
        return {
            resolve: function() {
                return $http.get("/api/my/account").then(function(response) {
                    $rootScope.setAccount(response.data);
                }, function(errorResponse) {
                    $rootScope.setAccount(null);
                    return $q.reject(errorResponse);
                });
            },
            update: function (account) {
                return $http.post("/api/my/account", account).then(function(response) {
                    return response.data;
                }, function (errorResponse) {
                    return $q.reject({status: "error"});
                });
            },
            requestKyc: function () {
                return $http.post("/api/my/account/kyc").then(function(response) {
                    return response.data;
                }, function (errorResponse) {
                    return $q.reject({status: "error"});
                });
            }
        };
    }]);

}());
