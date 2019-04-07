"use strict";

const db = require("ocore/db.js");

function select(device, callback) {
    db.query(`SELECT
            correspondent.device_address device,
            correspondent.name deviceName,
            account.payout_address payoutAddress,
            account.first_name firstName,
            account.last_name lastName,
            COALESCE(account.first_name || ' ' || account.last_name, account.first_name, account.last_name) fullName,
            account.has_drivers_license hasDriversLicense,
            account.vehicle vehicle
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
    db.query(`INSERT ${db.getIgnore()} INTO cp_accounts(device, payout_address, vehicle) VALUES (?, ?, ?)`, [device, account.payoutAddress, account.vehicle], (insertResult) => {
        if (insertResult.affectedRows === 1) {
            return callback(null);
        }

        db.query(`UPDATE cp_accounts SET payout_address = ?, vehicle = ? WHERE device = ?`, [account.payoutAddress, account.vehicle, device], (updateResult) => {
            if (updateResult.affectedRows === 1) {
                return callback(null);
            }

            callback(`Failed to update account for ${device}. Account was ${JSON.stringify(account)}`);
        });
    });
}

/**
 *
 * @param {string} device
 * @param {Object} profile
 * @param {string} profile.unit
 * @param {string} profile.firstName
 * @param {string} profile.lastName
 * @param {boolean} profile.isDriversLicense
 * @param callback
 */
function updateProfile(device, profile, callback) {
    db.query(`UPDATE cp_accounts SET profile_unit = ?, first_name = ?, last_name = ?, has_drivers_license = ? WHERE device = ?`,
        [profile.unit, profile.firstName, profile.lastName, profile.isDriversLicense, device], (updateResult) => {
        if (updateResult.affectedRows === 1) {
            return callback(null);
        }

        callback(`Failed to update account for ${device}`);
    });
}

module.exports = {
    select,
    upsert,
    updateProfile
};
