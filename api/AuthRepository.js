"use strict";

var db = require('byteballcore/db.js');

const AUTH_TIMEOUT_INTERVAL = '5 MINUTES';

function insertTempPairingSecret(pairingSecret, callback) {
    let expiryDate = db.addTime(AUTH_TIMEOUT_INTERVAL);
    db.query(
        "INSERT " + db.getIgnore() + " INTO pairing_secrets (pairing_secret, is_permanent, expiry_date) VALUES (?, ?, " + expiryDate + ")", [pairingSecret, false],
        function(result) {
            db.query("UPDATE pairing_secrets SET expiry_date = " + expiryDate + " WHERE pairing_secret = ?", [pairingSecret], function(result) {
                callback();
            });
        }
    );
}

function verifyPairingSecret(pairingSecret, callback) {
    db.query(`SELECT count(1) valid FROM pairing_secrets
            WHERE pairing_secret = ?
            AND ${db.getNow()} < expiry_date`, [pairingSecret], (result) => {
        if (!Array.isArray(result)) {
            return callback("Failed to fetch pairing secret, no result");
        }

        if (result[0].valid) {
            return callback(null);
        }

        callback("Pairing code does not exist or expired");
    });
}

module.exports.insertTempPairingSecret = insertTempPairingSecret;
module.exports.verifyPairingSecret = verifyPairingSecret;