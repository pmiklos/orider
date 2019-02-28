(function () {

    var app = angular.module("carpool");
    app.factory("google", ["CONFIG", "$sce", "$httpParamSerializer", function (config, $sce, $httpParamSerializer) {

        var mapsEmbedDirections = function (origin, destination) {
            const googleMapsParams = $httpParamSerializer({
                key: config.google.mapsEmbedKey,
                origin: origin,
                destination: destination,
                mode: "driving"
            });

            return $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/directions?" + googleMapsParams);
        };

        return {
            mapsEmbedDirections
        };
    }]);


}());
