"use strict";

module.exports = function (mapService) {

    return {

        score(ride, arrivalLocation) {
            if (typeof arrivalLocation.latitude === 'number' && typeof arrivalLocation.longitude === 'number') {
                const rideDistanceKm = mapService.distance(ride.pickupLat, ride.pickupLng, ride.dropoffLat, ride.dropoffLng, "K");
                const dropoffDistanceKm = mapService.distance(ride.dropoffLat, ride.dropoffLng, arrivalLocation.latitude, arrivalLocation.longitude, "K");
                const accuracyKm = (arrivalLocation.accuracy | 0.0) / 1000.0;

                const correctedDropoffDistanceKm = Math.max(0, dropoffDistanceKm - accuracyKm);
                return 1 - Math.min(1, correctedDropoffDistanceKm / rideDistanceKm);
            }
            return 1; // assume trip is completed 100% when the location is not sent by the client
        }

    };
};

