"use strict";

const composer = require('ocore/composer.js');
const network = require('ocore/network.js');

module.exports = function (carpoolOracleAddress, headlessWallet, web, ridesRepository) {

    function postRideStatus(rideId, rideStatus, callback) {
        const datafeed = {
            RIDE_STATUS: `RIDE-${rideId}-${rideStatus}`
        };

        console.error("[ORACLE] posting " + JSON.stringify(datafeed));

        const errorHandler = function(err) {
            console.error(`[ORACLE] failed to post ${JSON.stringify(datafeed)}: ${err}`);
        };

        composer.composeDataFeedJoint(carpoolOracleAddress, datafeed, headlessWallet.signer, composer.getSavingCallbacks({
            ifNotEnoughFunds: errorHandler,
            ifError: errorHandler,
            ifOk: function (joint) {
                network.broadcastJoint(joint);
                ridesRepository.payout(rideId, rideStatus, joint.unit.unit, (err) => {
                    if (err) return callback(`[ORACLE] failed to save ${rideStatus} status for ride ${rideId}`);
                    console.error(`[ORACLE] stored status for ride ${rideId} in unit ${joint.unit.unit}`);
                    callback(null);
                });
            }
        }));
    }

    function processCompletedRide(ride) {
        const totalPeople = ride.passengerCount + 1; // include driver
        const totalVoters = ride.scoredPassengerCount + 1; // include driver
        const totalScore = ride.passengerScore + ride.driverScore;

        const participationRate = totalVoters / totalPeople;

        if (participationRate < 0.67) {
            return; // skip and wait until more than two third of the people completed the ride
        }

        const averageScore = totalScore / totalVoters;
        const rideStatus = averageScore < 0.75 ? "INCOMPLETE" : "COMPLETED";

        postRideStatus(ride.rideId, rideStatus, (err) => {
            if (err) return console.error(err);
            web.send({
                id: ride.device,
                event: "rideCompleted",
                data: {
                    rideId: ride.rideId
                }
            });
        });
    }

    function processCompletedRides() {
        ridesRepository.selectAllPayable((err, rides) => {
            rides.forEach(processCompletedRide);
        });
        setTimeout(processCompletedRides, 5000);
    }

    return {
        start() {
            processCompletedRides();
        }
    };
};
