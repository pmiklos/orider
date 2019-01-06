"use strict";

const db = require("byteballcore/db.js");
const uuid = require("uuid/v4");

function board(rideId, callback) {
    updateStatus(rideId, ['created'], 'boarding', callback);
}

function complete(rideId, arrivalLocation, score, callback) {
    db.query(`UPDATE cp_rides SET
        status = 'completed',
        arrival_date = ${db.getNow()},
        arrival_lat = ?,
        arrival_lng = ?,
        arrival_accuracy = ?,
        completion_score = ?
        WHERE ride_id = ? AND status in ('boarding')
    `, [arrivalLocation.latitude, arrivalLocation.longitude, arrivalLocation.accuracy, score, rideId], (result) => {
        if (result.affectedRows === 1) {
            return callback(null, 'completed');
        }
        callback(`Failed to update ride (${rideId}) status to 'completed'`);
    });
}

function updateStatus(rideId, fromStatuses, toStatus, callback) {
    db.query(`UPDATE cp_rides SET status = ? WHERE ride_id = ? AND status in (?)
    `, [toStatus, rideId, fromStatuses], (result) => {
        if (result.affectedRows === 1) {
            return callback(null, toStatus);
        }
        callback(`Failed to update ride (${rideId}) status to ${toStatus}`);
    });
}

function create(device, ride, callback) {
    db.query(`INSERT INTO cp_rides (device, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, departure, seats, price_per_seat, checkin_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime(? / 1000, 'unixepoch'), ?, ?, ?)
    `, [device, ride.pickupAddress, ride.pickupLat, ride.pickupLng, ride.dropoffAddress, ride.dropoffLat, ride.dropoffLng, ride.departure, ride.seats, ride.pricePerSeat, uuid()], (result) => {
        if (result.affectedRows === 1) {
            return select(result.insertId, callback)
        }
        callback(`Failed to insert ride: ${device}, ${JSON.stringify(ride)}`);
    });
}

function select(id, callback) {
    db.query(`SELECT
            rides.ride_id id,
            rides.device,
            rides.device driver,
            rides.pickup_address pickupAddress,
            rides.pickup_lat pickupLat,
            rides.pickup_lng pickupLng,
            rides.dropoff_address dropoffAddress,
            rides.dropoff_lat dropoffLat,
            rides.dropoff_lng dropoffLng,
            strftime('%s', rides.departure) * 1000 departure,
            rides.seats,
            rides.price_per_seat pricePerSeat,
            count(reservations.device) reservationCount,
            rides.checkin_code checkInCode,
            rides.status,
            rides.completion_score completionScore
        FROM cp_rides rides
        LEFT JOIN cp_reservations reservations USING (ride_id)
        WHERE ride_id = ?`, [id], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback("Failed to find ride: " + JSON.stringify(rows));
    });
}

function selectByCheckInCode(checkInCode, callback) {
    db.query(`SELECT
            ride.ride_id id,
            ride.device,
            ride.device driver,
            account.payout_address payoutAddress,
            ride.pickup_address pickupAddress,
            ride.dropoff_address dropoffAddress,
            strftime('%s', ride.departure) * 1000 departure,
            ride.seats,
            ride.price_per_seat pricePerSeat,
            ride.checkin_code checkInCode,
            ride.status
        FROM cp_rides ride
        JOIN cp_accounts account USING (device)
        WHERE checkInCode = ?`, [checkInCode], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback("Failed to find ride: " + JSON.stringify(rows));
    });
}

function selectAll(from, size, callback) {
    const aDayBefore = db.addTime('-1 DAY');

    db.query(`SELECT
            rides.ride_id id,
            rides.device,
            rides.device driver,
            rides.pickup_address pickupAddress,
            rides.dropoff_address dropoffAddress,
            strftime('%s', rides.departure) * 1000 departure,
            rides.seats,
            rides.price_per_seat pricePerSeat,
            rides.status,
            count(reservations.device) reservationCount,
            group_concat(reservations.device, ',') reservationDevices
        FROM cp_rides rides
        LEFT JOIN cp_reservations reservations USING (ride_id)
        WHERE departure > ${aDayBefore}
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9
        ORDER BY departure ASC
        LIMIT ${size} OFFSET ${from}`, [], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find rides: " + JSON.stringify(rows));
    });
}

function selectAllByDevice(device, callback) {
    const aDayBefore = db.addTime('-1 DAY');

    db.query(`SELECT
            rides.ride_id id,
            rides.device,
            rides.device driver,
            rides.pickup_address pickupAddress,
            rides.dropoff_address dropoffAddress,
            strftime('%s', rides.departure) * 1000 departure,
            rides.seats,
            rides.price_per_seat pricePerSeat,
            rides.status,
            count(reservations.device) reservationCount
        FROM cp_rides rides
        LEFT JOIN cp_reservations reservations USING (ride_id)
        WHERE departure > ${aDayBefore}
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9
        ORDER BY departure ASC`, [device], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find rides: " + JSON.stringify(rows));
    });
}

function selectAllPayable(callback) {
    db.query(`SELECT
            ride.ride_id rideId,
            ride.completion_score driverScore,
            sum(reservation.completion_score) passengerScore,
            count(reservation.completion_score) scoredPassengerCount,
            count(*) passengerCount
        FROM cp_rides ride
        JOIN cp_reservations reservation USING (ride_id)
        WHERE
            ride.status = 'completed'
            AND ride.oracle_value IS NULL
            AND reservation.status IN ('checkedin', 'completed')
        GROUP BY ride_id
    `, [], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find payable rides " + JSON.stringify(rows));
    });
}

function selectAllByOracleUnit(units, callback) {
    db.query(`SELECT
            ride.ride_id rideId,
            ride.device device,
            ride.oracle_value oracleValue,
            account.payout_address payoutAddress
        FROM cp_rides ride
        JOIN cp_accounts account USING (device)
        WHERE oracle_unit IN (?)
    `, [units], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find payable rides " + JSON.stringify(rows));
    });
}

function payout(rideId, rideStatus, oracleUnit, callback) {
    db.query(`UPDATE cp_rides SET oracle_value = ?, oracle_unit = ? WHERE ride_id = ? AND oracle_value IS NULL`,
        [rideStatus, oracleUnit, rideId], (result) => {
        if (result.affectedRows === 1) {
            return callback();
        }
        callback(`Failed to update oracle value (${rideId}) to ${rideStatus} for unit ${oracleUnit}`);
    });
}

module.exports = {
    board,
    complete,
    create,
    payout,
    select,
    selectAll,
    selectAllByDevice,
    selectAllByOracleUnit,
    selectByCheckInCode,
    selectAllPayable
};
