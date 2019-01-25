"use strict";

module.exports = function (reservationsRepository) {

    function completeOverdueResevations() {
        reservationsRepository.completeAllOverdue(updateReservationCount => {
            if (updateReservationCount > 0) {
                console.error(`[OVERDUE] completed ${updateReservationCount} reservations`);
            }

            setTimeout(completeOverdueResevations, 30 * 1000);
        });
    }

    return {
        start() {
            completeOverdueResevations();
        }
    }
};