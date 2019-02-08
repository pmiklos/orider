(function () {
    var app = angular.module("carpool");

    /**
     * This WakeLockService is just a hack that plays a short 1x1 pixel video to prevent the screen from locking.
     * The "wake lock" must be acquired from a event handler eg. a mouse click.
     *
     * A real wake lock spec seem to exist, but has not been implemented yet by browsers: https://w3c.github.io/wake-lock/
     *
     * lock = window.navigator.requestWakeLock(resourceName);
     */
    app.factory("WakeLockService", ["DetectMobileBrowserService", function (DetectMobileBrowserService) {

        var noSleep;
        if (DetectMobileBrowserService.isMobile()) {
            noSleep = new NoSleep();
        } else {
            noSleep = {
                enable: function() {},
                disable: function() {}
            }
        }

        var wakeLockAcquired = false;

        return {
            acquire: function() {
                if (!wakeLockAcquired) {
                    noSleep.enable();
                    wakeLockAcquired = true;
                }
            },
            release: function () {
                if (wakeLockAcquired) {
                    noSleep.disable();
                    wakeLockAcquired = false;
                }
            },
            isAcquired() {
                return wakeLockAcquired;
            },
            noSleep: function () {
                // debug if video is running in console:
                // angular.element('*[ng-controller]').injector().get("WakeLockService").noSleep().noSleepVideo.currentTime;
                return noSleep;
            }
        };
    }]);
}());
