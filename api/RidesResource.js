"use strict";

function deleteCoordinates(ride) {
    if (typeof ride === "object") {
        delete ride.pickupLat;
        delete ride.pickupLng;
        delete ride.dropoffLat;
        delete ride.dropoffLng;
    }
    return ride;
}

module.exports = function (ridesRepository, authRepository, mapService, completionScoring) {

    function board(req, res, next) {
        const checkInCode = "CHECKIN-" + req.ride.checkInCode;
        authRepository.insertPermanentPairingSecret(checkInCode, "30 MINUTES", () => {
            ridesRepository.board(req.ride.id, (err, status) => {
                if (err) return next(err);
                res.json({
                    checkInCode,
                    status
                });
            });
        });
    }

    function complete(req, res, next) {
        const ride = req.ride;
        const arrivalLocation = req.body;

        const completionScore = completionScoring.score(ride, arrivalLocation);

        ridesRepository.complete(ride.id, arrivalLocation, completionScore, (err, status) => {
            if (err) return next(err);
            res.json({
                status,
                completionScore
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
                    res.json(deleteCoordinates(ride));
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
        res.json(deleteCoordinates(req.ride));
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
        complete,
        create,
        get,
        fetch,
        list,
        listByDevice
    };
};
