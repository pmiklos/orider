/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bStaticChangeAddress = true;

exports.storage = 'sqlite';
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
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
exports.googleMapsEmbedKey = "GOOGLE MAPS EMBED API KEY"; // used on front end

exports.realnameAttestor = process.env.testnet ? 'RJV3YUZ3FG3MPBWXX4RSD7PCPOIGGQZB' : 'I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT';
exports.realnameAttestorSmartID = process.env.testnet ? '' : 'OHVQ2R5B6TUR5U7WJNYLP3FIOSR7VCED';

console.log('finished carpool conf');
