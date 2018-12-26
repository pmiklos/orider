(function () {

    var app = angular.module("carpool", ["ngRoute", "ngCookies", "monospaced.qrcode"]);

    function fetchConfig() {
        var initInjector = angular.injector(["ng"]);
        var $http = initInjector.get("$http");

        return $http.get("/api/config").then(function (response) {
            app.constant("CONFIG", response.data);
            return response.data;
        }, function (errorResponse) {
            console.error("Failed to fetch bootstrapping data: " + errorResponse);
            throw Error("Failed to bootstrap application");
        });
    }

    function bootstrapApplication(config) {
        angular.element(document).ready(function () {
            angular.bootstrap(document, ["carpool"]);
        });
        return config;
    }

    app.config(function ($routeProvider, $compileProvider, $httpProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension|byteball|byteball-tn):|data:image\/)/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|byteball|byteball-tn):/);
        $httpProvider.interceptors.push("HttpInterceptor");

        $routeProvider
            .when("/login", {
                nav: "Login",
                templateUrl: "view/login.html",
                controller: "LoginController",
                resolve: {
                    login: function(AuthService) {
                        return AuthService.resolve();
                    }
                }
            })
            .otherwise({
                templateUrl: "view/rides.html",
                controller: "RidesController",
                resolve: {
                    account: function(AccountService) {
                        return AccountService.resolve();
                    }
                }
            });
    });

    const KBYTE = 1000;
    const MBYTE = 1000 * KBYTE;
    const GBYTE = 1000 * MBYTE;

    app.filter("GBYTE", function() {
        return function(amount) {
            return amount / GBYTE;
        };
    });

    app.filter("paymentUrl", ["byteball", function(byteball) {
        return function(payment) {
            if (typeof payment === 'object') {
                return byteball.requestPaymentUrl(payment.address, payment.amount, payment.asset);
            }
            return "";
        };
    }]);

    fetchConfig().then(bootstrapApplication);

})();
