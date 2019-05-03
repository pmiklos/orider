"use strict";

module.exports = function (reservationRepository, ridesRepository, completionScoring, chatProcessor) {

    function complete(req, res, next) {
        const rideId = req.params.id;
        const device = req.accessToken.dev;
        const arrivalLocation = req.body;

        ridesRepository.select(rideId, (err, ride) => {
            if (err) return next(err);

            const completionScore = completionScoring.score(ride, arrivalLocation);

            reservationRepository.complete(rideId, device, arrivalLocation, completionScore, (err, status) => {
                if (err) return next(err);
                res.json({
                    status,
                    completionScore
                });
            });
        });
    }

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

    function get(req, res, next) {
        const rideId = req.params.id;
        const device = req.accessToken.dev;

        reservationRepository.select(rideId, device, (err, reservation) => {
            if (err) return next(err);
            res.json(reservation);
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

    function contactDriver(req, res, next) {
        const rideId = req.params.id;
        const device = req.accessToken.dev;

        reservationRepository.select(rideId, device, (err) => {
            if (err) return next(err);
            chatProcessor.contactDriver(rideId, device, (err) => {
                if (err) return next(err);
                res.json({});
            });
        });
    }

    return {
        get,
        complete,
        create,
        listByRide,
        listByDevice,
        contactDriver
    };
};
