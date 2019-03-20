(function() {

    var app = angular.module("carpool");

    app.factory("HttpInterceptor", ["$q", "$rootScope", "$location", function($q, $rootScope, $location) {

        return {
            "responseError": function(rejection) {
                if (rejection.status == 401) {
                    var url = $location.url() || "/";

                    if (url.startsWith("/my")) {
                        angular.element("#unauthorizedError").modal();
                        $rootScope.referrerUrl = url;
                    }
                }
                if (rejection.status == 403) {
                    angular.element("#forbiddenWarning").modal();
                }
                return $q.reject(rejection);
            }
        };

    }]);

})();
