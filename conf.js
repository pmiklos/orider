/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bStaticChangeAddress = true;

exports.storage = 'sqlite';
exports.hub = 'obyte.org/bb-test';
exports.deviceName = 'Carpooling';
exports.permanent_pairing_secret = '0000';
exports.KEYS_FILENAME = 'keys.json';

//exports.control_addresses = [""];
//exports.payout_address = "";

exports.supportsHttps = true;
exports.authSecret = "secret";
exports.authTimeout = 300000; // the user has 5 minutes to confirm logon with pairing code

exports.googleMapsApiKey = "GOOGLE MAPS API KEY";

// exports.rideFeeContractTemplate = "hash of unit of the contract template"

console.log('finished carpool conf');
