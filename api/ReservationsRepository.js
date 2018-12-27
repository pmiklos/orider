"use strict";

const db = require("byteballcore/db.js");

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

function select(rideId, device, callback) {
    db.query(`SELECT
        ride_id rideId,
        device,
        device name, -- until we have attestation
        status,
        reservation_date reservationDate
        FROM cp_reservations
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
        reservation_date reservationDate
        FROM cp_reservations
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
        reservation.reservation_date reservationDate
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

function checkin(rideId, device, callback) {
    db.query(`UPDATE cp_reservations SET status = 'checkedin'
        WHERE ride_id =? AND device = ? AND status IN ('reserved', 'checkedin')`, [rideId, device], (result) => {
        if (result.affectedRows === 1) {
            return callback(null);
        }
        callback(`Failed to check-in: ${rideId} ${device}, ${JSON.stringify(result)}`);
    });
}

module.exports = {
    create,
    select,
    selectAllByRide,
    selectAllByDevice,
    checkin
};
