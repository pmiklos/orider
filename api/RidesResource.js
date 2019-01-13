"use strict";

const constants = require("byteballcore/constants");
const device = require("byteballcore/device"); // would be better to a NotificationService as a depedency

// TODO make it reusable
function isTestnet() {
    const byteballVersion = constants.version;
    return byteballVersion.endsWith("t");
}

// TODO make it reusable
const WEB_URL = isTestnet() ? "https://carpool-test.byteball.market" : "https://carpool.byteball.market";

function deleteCoordinates(ride) {
    if (typeof ride === "object") {
        delete ride.pickupLat;
        delete ride.pickupLng;
        delete ride.dropoffLat;
        delete ride.dropoffLng;
    }
    return ride;
}

module.exports = function (ridesRepository, reservationsRepository, authRepository, mapService, completionScoring) {

    function board(req, res, next) {
        const checkInCode = "CHECKIN-" + req.ride.checkInCode;
        authRepository.insertPermanentPairingSecret(checkInCode, "24 HOURS", () => {
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

            reservationsRepository.selectAllByRide(ride.id, (err, reservations) => {
                if (err) return console.error("Failed to notify passengers to complete ride " + ride.id);

                reservations.forEach(reservation => {
                    device.sendMessageToDevice(reservation.device, "text",
                        `You arrived! Please complete the ride by visiting the link below:\n${WEB_URL}/#!/my/reservations/${ride.id}`);
                });
            });

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

    function fetchMine(req, res, next) {
        ridesRepository.select(req.params.id, (err, ride) => {
            if (err) return next(err);
            if (!ride || ride.device !== req.accessToken.dev) return next({
                status: 404,
                message: "No such ride"
            });
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
        fetchMine,
        list,
        listByDevice
    };
};
