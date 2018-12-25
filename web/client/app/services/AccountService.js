(function() {

    var app = angular.module("carpool");

    app.factory("AccountService", function($rootScope, $http) {
        return {
            resolve: function() {
                return $http.get("/api/my/account").then(function(response) {
                    $rootScope.setAccount(response.data);
                }, function(errorResponse) {
                    $rootScope.setAccount(null);
                    console.error("Failed to load account: " + errorResponse);
                });
            }
        };
    });

}());
