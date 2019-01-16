(function() {

    var app = angular.module("carpool");

    app.factory("LocationService", [function() {

        const locationSettings = {
            maximumAge: 5000,
            timeout: 60000,
            enableHighAccuracy: true
        };

        function watch(lat, lng, callback) {
            if ("geolocation" in navigator) {
                const watchId = navigator.geolocation.watchPosition(function(position) {
                    const dropoffDistanceKm = distance(lat, lng, position.coords.latitude, position.coords.longitude, "K");
                    const accuracyKm = (position.coords.accuracy | 0.0) / 1000.0;

                    const correctedDropoffDistanceKm = Math.max(0, dropoffDistanceKm - accuracyKm);

                    if (correctedDropoffDistanceKm < 0.05) {
                        navigator.geolocation.clearWatch(watchId);
                        callback();
                    }
                }, function(error) {
                    if (error.code === error.PERMISSION_DENIED) {
                        callback("Location service is not enabled.");
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        callback("Position is unavailable.");
                    } else {
                        callback("Timed out while acquiring position");
                    }
                }, locationSettings);
                return watchId;
            } else {
                callback("Location service is not available");
                return 0;
            }
        }

        function clear(watchId) {
            if ("geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchId);
            }
        }

        return {
            watch: watch,
            clear: clear
        };

    }]);

})();
