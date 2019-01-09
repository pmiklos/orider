"use strict";

const db = require("byteballcore/db.js");

function complete(rideId, device, arrivalLocation, score, callback) {
    db.query(`UPDATE cp_reservations SET
        status = 'completed',
        arrival_date = ${db.getNow()},
        arrival_lat = ?,
        arrival_lng = ?,
        arrival_accuracy = ?,
        completion_score = ?
        WHERE ride_id = ? AND device = ? AND status in ('checkedin')
    `, [arrivalLocation.latitude, arrivalLocation.longitude, arrivalLocation.accuracy, score, rideId, device], (result) => {
        if (result.affectedRows === 1) {
            return callback(null, 'completed');
        }
        callback(`Failed to update reservation (${rideId}, ${device}) status to 'completed'`);
    });
}

function create(rideId, device, callback) {
    db.query(`INSERT ${db.getIgnore()} INTO cp_reservations (ride_id, device)
        SELECT ride_id, ? FROM cp_rides
        LEFT JOIN cp_reservations USING (ride_id)
        WHERE ride_id = ?
        GROUP BY ride_id
        HAVING count(1) <= seats
    `, [device, rideId], (result) => {
        if (result.affectedRows === 1) {
            return callback(null);
        }
        callback(`Failed to insert reservation: ${rideId} ${device}, ${JSON.stringify(result)}`);
    });
}

/**
 * @typedef {Object} ReservationResult
 * @property {number} rideId,
 * @property {string} device
 * @property {string} name
 * @property {string} status
 * @property {number} reservationDate
 * @property {string} payoutAddress
 */

/**
 * @callback ReservationCallback
 * @param {(string|null)} err
 * @param {ReservationResult=} reservation
 */

/**
 *
 * @param rideId
 * @param device
 * @param {ReservationCallback} callback
 */
function select(rideId, device, callback) {
    db.query(`SELECT
        ride_id rideId,
        device,
        device name, -- until we have attestation
        status,
        reservation_date reservationDate,
        completion_score completionScore,
        account.payout_address payoutAddress
        FROM cp_reservations reservation
        JOIN cp_accounts account USING (device)
        WHERE ride_id = ? AND device = ?`, [rideId, device], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback(`Failed to find reservation: ${rideId} ${device} ${JSON.stringify(rows)}`);
    });
}

function selectAllByRide(rideId, callback) {
    db.query(`SELECT
        ride_id rideId,
        device,
        device name, -- until we have attestation
        status,
        reservation_date reservationDate,
        contract_address contractAddress,
        payment_status paymentStatus,
        account.payout_address payoutAddress
        FROM cp_reservations
        LEFT JOIN cp_accounts account USING (device)
        WHERE ride_id = ?
        ORDER BY reservation_date`, [rideId], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback(`Failed to find reservations: ${rideId} ${JSON.stringify(rows)}`);
    });
}

function selectAllByDevice(device, callback) {
    db.query(`SELECT
        ride.ride_id rideId,
        ride.pickup_address pickupAddress,
        ride.dropoff_address dropoffAddress,
        strftime('%s', ride.departure) * 1000 departure,
        reservation.status,
        reservation.reservation_date reservationDate,
        reservation.payment_status paymentStatus
        FROM cp_reservations reservation
        JOIN cp_rides ride USING (ride_id)
        WHERE reservation.device = ?
        ORDER BY ride.departure`, [device], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback(`Failed to find reservations: ${device} ${JSON.stringify(rows)}`);
    });
}

function selectByContractPaymentUnits(units, callback) {
    db.query(`SELECT
        reservation.ride_id rideId,
        reservation.device,
        reservation.device name, -- until we have attestation
        reservation.status,
        reservation.reservation_date reservationDate,
        reservation.contract_address contractAddress
        FROM cp_reservations reservation
        JOIN cp_rides ride USING (ride_id)
        JOIN outputs ON contract_address = outputs.address
        WHERE outputs.unit IN (?)
            AND outputs.amount = ride.price_per_seat
            AND outputs.asset IS NULL`, [units], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback(`Failed to find reservations for payment units: ${JSON.stringify(units)}`);
    });
}

/**
 * @callback NoArgCallback
 * @param {string|null=} err
 */

/**
 * @param {number} rideId
 * @param {string} device
 * @param {string} contractAddress
 * @param {NoArgCallback} callback
 */
function checkin(rideId, device, contractAddress, callback) {
    db.query(`UPDATE cp_reservations SET status = 'checkedin', checkin_date = ${db.getNow()}, contract_address = ?
        WHERE ride_id = ? AND device = ? AND status IN ('reserved', 'checkedin')`,
        [contractAddress, rideId, device], (result) => {
        if (result.affectedRows === 1) {
            return callback();
        }
        callback(`Failed to check-in: ${rideId} ${device}, ${JSON.stringify(result)}`);
    });
}

function paymentReceived(rideId, device, callback) {
    db.query(`UPDATE cp_reservations SET payment_status = 'received'
        WHERE ride_id = ? AND device = ? AND payment_status IN ('unpaid', 'received')`,
        [rideId, device], (result) => {
            if (result.affectedRows === 1) {
                return callback();
            }
            callback(`Failed to update payment status to received: ${rideId} ${device}, ${JSON.stringify(result)}`);
        });
}

module.exports = {
    complete,
    create,
    select,
    selectAllByRide,
    selectAllByDevice,
    selectByContractPaymentUnits,
    checkin,
    paymentReceived
};
