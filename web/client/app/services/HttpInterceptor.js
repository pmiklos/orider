(function() {

    var app = angular.module("carpool");

    app.factory("HttpInterceptor", ["$q", function($q) {

        return {
            "responseError": function(rejection) {
                if (rejection.status == 401) {
                }
                if (rejection.status == 403) {
                    angular.element("#forbiddenWarning").modal({
                        backdrop: "static"
                    });
                }
                return $q.reject(rejection);
            }
        };

    }]);

})();
