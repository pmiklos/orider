"use strict";

const db = require("ocore/db.js");

function select(device, callback) {
    db.query(`SELECT
            correspondent.device_address device,
            correspondent.name deviceName,
            account.payout_address payoutAddress,
            account.first_name firstName,
            account.last_name lastName,
            COALESCE(account.first_name || ' ' || account.last_name, account.first_name, account.last_name) fullName
        FROM correspondent_devices correspondent
        LEFT JOIN cp_accounts account ON device_address = device
        WHERE device_address = ?`, [device], (rows) => {
        if (Array.isArray(rows) && rows.length === 1) {
            return callback(null, rows[0]);
        }
        callback(`Failed to find account ${device}: ` + JSON.stringify(rows));
    });
}

function upsert(device, account, callback) {
    db.query(`INSERT ${db.getIgnore()} INTO cp_accounts(device, payout_address) VALUES (?, ?)`, [device, account.payoutAddress], (insertResult) => {
        if (insertResult.affectedRows === 1) {
            return callback(null);
        }

        db.query(`UPDATE cp_accounts SET payout_address = ? WHERE device = ?`, [account.payoutAddress, device], (updateResult) => {
            if (updateResult.affectedRows === 1) {
                return callback(null);
            }

            callback(`Failed to update account for ${device}. Account was ${JSON.stringify(account)}`);
        });
    });
}

function updateName(device, firstName, lastName, callback) {
    db.query(`UPDATE cp_accounts SET first_name = ?, last_name = ? WHERE device = ?`, [firstName, lastName, device], (updateResult) => {
        if (updateResult.affectedRows === 1) {
            return callback(null);
        }

        callback(`Failed to update account for ${device}`);
    });
}

module.exports = {
    select,
    upsert,
    updateName
};