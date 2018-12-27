"use strict";

module.exports = function (ridesRepository, authRepository, mapService) {

    function board(req, res) {
        const checkInCode = "CHECKIN-" + req.ride.checkInCode;
        authRepository.insertPermanentPairingSecret(checkInCode, "5 MINUTES", () => {
            res.json({
                checkInCode
            });
        });
    }

    function create(req, res, next) {
        mapService.geocode(req.body.pickupAddress, (err, pickupLocation) => {
            if (err) return next(err);

            mapService.geocode(req.body.dropoffAddress, (err, dropoffLocation) => {
                if (err) return next(err);

                const locations = {
                    pickupLat: pickupLocation.lat,
                    pickupLng: pickupLocation.lng,
                    dropoffLat: dropoffLocation.lat,
                    dropoffLng: dropoffLocation.lng
                };

                const ride = { ...req.body, ...locations };

                ridesRepository.create(req.accessToken.dev, ride, (err, ride) => {
                    if (err) return next(err);
                    res.json(ride);
                });
            });
        });
    }

    function fetch(req, res, next) {
        ridesRepository.select(req.params.id, (err, ride) => {
           if (err) return next(err);
           req.ride = ride;
           next();
        });
    }

    function get(req, res) {
        res.json(req.ride);
    }

    function list(req, res, next) {
        let from = Number.parseInt(req.query.from) || 0;
        let size = Number.parseInt(req.query.size) || 10;

        ridesRepository.selectAll(from, Math.min(size, 50), (err, rides) => {
            if (err) return next(err);
            res.json({
                rides
            });
        });
    }

    function listByDevice(req, res, next) {
        ridesRepository.selectAll(req.accessToken.dev, (err, rides) => {
            if (err) return next(err);
            res.json({
                rides
            });
        });
    }

    return {
        board,
        create,
        get,
        fetch,
        list,
        listByDevice
    };
};
