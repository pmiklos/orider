/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bStaticChangeAddress = true;

exports.storage = 'sqlite';
exports.hub = 'obyte.org/bb-test';
exports.deviceName = 'Carpooling';
exports.permanent_pairing_secret = '0000';
exports.redirect_pairing_secret = '0001';
exports.KEYS_FILENAME = 'keys.json';

//exports.control_addresses = [""];
//exports.payout_address = "";

exports.supportsHttps = true;
exports.authSecret = "secret";
exports.authTimeout = 300000; // the user has 5 minutes to confirm logon with pairing code

exports.googleMapsApiKey = "GOOGLE MAPS API KEY";

exports.realnameAttestor = "RJV3YUZ3FG3MPBWXX4RSD7PCPOIGGQZB";

console.log('finished carpool conf');
