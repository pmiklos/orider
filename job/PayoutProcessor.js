"use strict";

module.exports = function (headlessWallet, web, ridesRepository, reservationsRepository) {

    function notify(rideId, driver, passenger) {
        web.send({
            id: driver,
            event: "paidOut",
            data: {
                rideId: rideId,
                device: passenger
            }
        });
        web.send({
            id: passenger,
            event: "paidOut",
            data: {
                rideId: rideId,
                device: passenger
            }
        });
    }

    // TODO transaction fee has to be calculated when creating the contract to be able to transfer the money.
    function makePayment(fromAddress, toAddress, toDevice, callback) {
        headlessWallet.sendAllBytesFromAddress(fromAddress, toAddress, toDevice, (err, unit) => {
            if (err) return callback(`[PAYOUT] Failed to make payment from ${fromAddress} to ${toAddress}: ${err}`);
            console.error(`[PAYOUT] Payment made from ${fromAddress} to ${toAddress} in unit ${unit}`);
            callback(null, unit);
        });
    }

    function payoutReservation(rideId, rideStatus, contract, driver, passenger) {
        if (rideStatus === 'COMPLETED') {
            makePayment(contract, driver.payoutAddress, driver.device, (err, unit) => {
                if (err) return console.error(err);
                reservationsRepository.paidOut(rideId, passenger.device, unit, (err) => {
                    if (err) return console.error(err);
                    notify(rideId, driver.device, passenger.device);
                });
            });
        } else if (rideStatus === 'INCOMPLETE') {
            makePayment(contract, passenger.payoutAddress, passenger.device, (err, unit) => {
                if (err) return console.error(err);
                reservationsRepository.refunded(rideId, passenger.device, unit, (err) => {
                    if (err) return console.error(err);
                    notify(rideId, driver.device, passenger.device);
                });
            });
        } else {
            console.error(`[PAYOUT] Failed to payout contract ${contract}: invalid ride status ${rideStatus}`);
        }
    }

    function payoutRide(ride) {
        reservationsRepository.selectAllByRide(ride.rideId, (err, reservations) => {
            if (err) return console.error("[PAYOUT] Failed to fetch reservations to payout. Ride id: " + ride.rideId);
            reservations.forEach(reservation => {
                payoutReservation(ride.rideId, ride.oracleValue, reservation.contractAddress, ride, reservation);
            });
        });
    }

    function payoutRides(units) {
        ridesRepository.selectAllByOracleUnit(units, (err, rides) => {
            if (err) return console.error("[PAYOUT] Failed to fetch rides to payout. Oracle units: " + JSON.stringify(units));
            rides.forEach(payoutRide);
        });
    }

    return {

        payoutRides

    };

};