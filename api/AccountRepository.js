"use strict";

const db = require("byteballcore/db.js");

function create(device, callback) {
    db.query(`INSERT ${db.getIgnore()} INTO cp_accounts(device) VALUES (?)`, [device], (result) => {
        if (result.affectedRows === 1) {
            return callback(null);
        }
        callback(`Failed to created account for ${device}`);
    });
}

function select(device, callback) {
    db.query(`SELECT
            device_address device,
            payout_address payoutAddress,
            correspondent.name deviceName
        FROM cp_accounts
        JOIN correspondent_devices correspondent ON device_address = device
        WHERE device = ?`, [device], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback(`Failed to find account ${device}: ` + JSON.stringify(rows));
    });
}

module.exports = {
    create,
    select
};