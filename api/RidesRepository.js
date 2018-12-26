"use strict";

const db = require("byteballcore/db.js");


function create(device, ride, callback) {
    db.query(`INSERT INTO cp_rides (device, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, departure, seats, price_per_seat)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime(? / 1000, 'unixepoch'), ?, ?)
    `, [device, ride.pickupAddress, ride.pickupLat, ride.pickupLng, ride.dropoffAddress, ride.dropoffLat, ride.dropoffLng, ride.departure, ride.seats, ride.pricePerSeat], (result) => {
        if (result.affectedRows === 1) {
            return callback(null, ride);
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
            rides.dropoff_address dropoffAddress,
            strftime('%s', rides.departure) * 1000 departure,
            rides.seats,
            rides.price_per_seat pricePerSeat,
            count(reservations.device) reservationCount
        FROM cp_rides rides
        LEFT JOIN cp_reservations reservations USING (ride_id)
        WHERE ride_id = ?`, [id], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback("Failed to find ride: " + JSON.stringify(rows));
    });
}

function selectAll(from, size, callback) {
    db.query(`SELECT
            rides.ride_id id,
            rides.device,
            rides.device driver,
            rides.pickup_address pickupAddress,
            rides.dropoff_address dropoffAddress,
            strftime('%s', rides.departure) * 1000 departure,
            rides.seats,
            rides.price_per_seat pricePerSeat,
            count(reservations.device) reservationCount
        FROM cp_rides rides
        LEFT JOIN cp_reservations reservations USING (ride_id)
        WHERE departure > ${db.getNow()}
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
        ORDER BY departure ASC
        LIMIT ${size} OFFSET ${from}`, [], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find rides: " + JSON.stringify(rows));
    });
}

function selectAllByDevice(device, callback) {
    db.query(`SELECT
            rides.ride_id id,
            rides.device,
            rides.device driver,
            rides.pickup_address pickupAddress,
            rides.dropoff_address dropoffAddress,
            strftime('%s', rides.departure) * 1000 departure,
            rides.seats,
            rides.price_per_seat pricePerSeat,
            count(reservations.device) reservationCount
        FROM cp_rides rides
        LEFT JOIN cp_reservations reservations USING (ride_id)
        WHERE departure > ${db.getNow()}
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
        ORDER BY departure ASC`, [device], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find rides: " + JSON.stringify(rows));
    });
}

module.exports = {
    create,
    select,
    selectAll,
    selectAllByDevice
};
