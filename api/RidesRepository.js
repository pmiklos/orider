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

function selectAll(from, size, callback) {
    db.query(`SELECT
            device,
            device driver,
            pickup_address pickupAddress,
            dropoff_address dropoffAddress,
            strftime('%s', departure) * 1000 departure,
            seats,
            price_per_seat pricePerSeat
        FROM cp_rides
--        WHERE departure > ${db.getNow()}
        ORDER BY departure ASC
        LIMIT ${size} OFFSET ${from}`, [], (rows) => {
        if (Array.isArray(rows)) {
            return callback(null, rows);
        }
        callback("Failed to find rides: " + JSON.stringify(rows));
    });
}

module.exports = {
    create,
    selectAll
};
