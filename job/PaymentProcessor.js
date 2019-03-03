"use strict";

const EVENT = {
    PAYMENT_RECEIVED: "paymentReceived",
    PAYMENT_CONFIRMED: "paymentConfirmed"
};

module.exports = function (web, ridesRepository, reservationsRepository) {

    function nofifyDriver(ride, event) {
        web.send({
            id: ride.device,
            event: event,
            data: {
                rideId: ride.id
            }
        });
    }

    function reservationReceived(reservation) {
        reservationsRepository.paymentReceived(reservation.rideId, reservation.device, reservation.paymentUnit, (err) => {
            if (err) return console.error(`[PAYMENT] ${err}`);

            ridesRepository.select(reservation.rideId, (err, ride) => {
                if (err) return console.error(`[PAYMENT] ${err}`);
                nofifyDriver(ride, EVENT.PAYMENT_RECEIVED);
            });
        });
    }

    function reservationsReceived(units) {
        reservationsRepository.selectByContractPaymentUnits(units, (err, reservations) => {
            if (err) return console.error(`[PAYMENT] ${err}`);
            reservations.forEach(reservationReceived);
        });
    }

    function reservationConfirmed(reservation) {
        reservationsRepository.paymentConfirmed(reservation.rideId, reservation.device, reservation.paymentUnit, (err) => {
            if (err) return console.error(`[PAYMENT] ${err}`);

            ridesRepository.select(reservation.rideId, (err, ride) => {
                if (err) return console.error(`[PAYMENT] ${err}`);
                nofifyDriver(ride, EVENT.PAYMENT_CONFIRMED);
            });
        });
    }

    function reservationsConfirmed(units) {
        reservationsRepository.selectByContractPaymentUnits(units, (err, reservations) => {
            if (err) return console.error(`[PAYMENT] ${err}`);
            reservations.forEach(reservationConfirmed);
        });
    }

    return {
        reservationsReceived,
        reservationsConfirmed
    };
};