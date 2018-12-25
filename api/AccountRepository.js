"use strict";

const db = require("byteballcore/db.js");

function selectAccount(deviceAddress, callback) {
    db.query(`SELECT
            device_address device,
            name deviceName
        FROM correspondent_devices
        WHERE device_address = ?`, [deviceAddress], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback("Failed to find account: " + JSON.stringify(rows));
    });
}

module.exports = {
    selectAccount
};