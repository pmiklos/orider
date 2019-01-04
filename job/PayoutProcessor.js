"use strict";

module.exports = function (headlessWallet, ridesRepository, reservationsRepository) {

    // TODO transaction fee has to be calculated when creating the contract to be able to transfer the money.
    function makePayment(fromAddress, toAddress, toDevice) {
        headlessWallet.sendAllBytesFromAddress(fromAddress, toAddress, toDevice, (err, unit) => {
            if (err) return console.error(`[PAYOUT] Failed to make payment from ${fromAddress} to ${toAddress}: ${err}`);
            console.error(`[PAYOUT] Payment made from ${fromAddress} to ${toAddress} in unit ${unit}`);
        });
    }

    function payoutReservation(rideStatus, contract, driver, passenger) {
        if (rideStatus === 'COMPLETED') {
            makePayment(contract, driver.payoutAddress, driver.device);
        } else if (rideStatus === 'INCOMPLETE') {
            makePayment(contract, passenger.payoutAddress, passenger.device);
        } else {
            console.error(`[PAYOUT] Failed to payout contract ${contract}: invalid ride status ${rideStatus}`);
        }
    }

    function payoutRide(ride) {
        reservationsRepository.selectAllByRide(ride.rideId, (err, reservations) => {
            if (err) return console.error("[PAYOUT] Failed to fetch reservations to payout. Ride id: " + ride.rideId);
            reservations.forEach(reservation => {
                payoutReservation(ride.oracleValue, reservation.contractAddress, ride, reservation);
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