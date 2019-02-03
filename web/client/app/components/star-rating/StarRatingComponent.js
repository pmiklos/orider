// Add icon library:
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
(function () {

    var app = angular.module("carpool");

    app.component("starRating", {
        template: '<span ng-repeat="star in $ctrl.stars" ng-class="star"></span> {{ $ctrl.rating | number : 1 }}',
        bindings: {
            rating: "<"
        },
        controller: ["$scope", function ($scope) {
            let ctrl = this;

            ctrl.$onInit = function() {
                ctrl.stars = [];

                for (let i = 0; i < 5; i++) {
                    let filled = i < Math.round(ctrl.rating);
                    ctrl.stars.push({
                        "fa": true,
                        "fa-star": true,
                        "text-primary": filled,
                        "text-muted": !filled
                    });
                }
            };
        }]
    });

})();
