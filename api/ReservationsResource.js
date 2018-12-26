"use strict";

module.exports = function (reservationRepository) {

    function create(req, res, next) {
        const rideId = req.ride.id;
        const device = req.accessToken.dev;

        reservationRepository.create(rideId, device, (err) => {
            if (err) return next(err);

            reservationRepository.select(rideId, device, (err, reservation) => {
                if (err) return next(err);
                res.json(reservation);
            });
        });
    }

    function listByRide(req, res, next) {
        const rideId = req.ride.id;

        reservationRepository.selectAllByRide(rideId, (err, reservations) => {
            if (err) return next(err);
            res.json({
                reservations
            });
        });
    }

    function listByDevice(req, res, next) {
        const device = req.accessToken.dev;

        reservationRepository.selectAllByDevice(device, (err, reservations) => {
            if (err) return next(err);
            res.json({
                reservations
            });
        });
    }

    return {
        create,
        listByRide,
        listByDevice
    };
};
