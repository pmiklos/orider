"use strict";

const constants = require("ocore/constants");
const device = require("ocore/device"); // would be better to a NotificationService as a depedency

// TODO make it reusable
function isTestnet() {
    const byteballVersion = constants.version;
    return byteballVersion.endsWith("t");
}

// TODO make it reusable
const WEB_URL = isTestnet() ? "https://carpool-test.byteball.market" : "https://orider.obyte.app";

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
                        `You arrived! Please complete the ride by visiting the link below in 5 minutes or do nothing ` +
                        `if you accept the driver's score: ${completionScore.toFixed(2) * 100}%\n` +
                        `${WEB_URL}/#!/my/reservations/${ride.id}`);
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

                    authRepository.insertPermanentPairingSecret(`CONTACT-${ride.id}`, "3 MONTH", (err) => {
                        if (err) console.error(err);
                    });
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
            if (!ride) return next({
                status: 404,
                message: "Not found"
            });

            if (ride.device !== req.accessToken.dev) return next({
                status: 403,
                message: "No allowed"
            });
            req.ride = ride;
            next();
        });
    }

    function getMine(req, res) {
        res.json(req.ride);
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
        getMine,
        fetch,
        fetchMine,
        list,
        listByDevice
    };
};
