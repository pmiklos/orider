"use strict";

module.exports = function (web, ridesRepository, reservationsRepository) {

    function nofifyDriver(ride) {
        web.send({
            id: ride.device,
            event: "paymentReceived",
            data: {
                rideId: ride.id
            }
        });
    }

    function reservationReceived(reservation) {
        reservationsRepository.paymentReceived(reservation.rideId, reservation.device, (err) => {
            if (err) return console.error(`[PAYMENT] ${err}`);

            ridesRepository.select(reservation.rideId, (err, ride) => {
                if (err) return console.error(`[PAYMENT] ${err}`);
                nofifyDriver(ride);
            });
        });
    }

    function reservationsReceived(units) {
        reservationsRepository.selectByContractPaymentUnits(units, (err, reservations) => {
            if (err) return console.error(`[PAYMENT] ${err}`);
            reservations.forEach(reservationReceived);
        });
    }

    return {
        reservationsReceived
    };
};