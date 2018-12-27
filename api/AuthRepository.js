"use strict";

var db = require('byteballcore/db.js');


function insertPairingSecret(pairingSecret, isPermanent, timeout, callback) {
    let expiryDate = db.addTime(timeout);
    db.query(
        "INSERT " + db.getIgnore() + " INTO pairing_secrets (pairing_secret, is_permanent, expiry_date) VALUES (?, ?, " + expiryDate + ")", [pairingSecret, isPermanent],
        function(result) {
            db.query("UPDATE pairing_secrets SET expiry_date = " + expiryDate + " WHERE pairing_secret = ?", [pairingSecret], function(result) {
                callback();
            });
        }
    );
}

function insertTempPairingSecret(pairingSecret, timeout, callback) {
    insertPairingSecret(pairingSecret, false, timeout, callback);
}
function insertPermanentPairingSecret(pairingSecret, timeout, callback) {
    insertPairingSecret(pairingSecret, true, timeout, callback);
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

module.exports = {
    insertTempPairingSecret,
    insertPermanentPairingSecret,
    verifyPairingSecret
};
