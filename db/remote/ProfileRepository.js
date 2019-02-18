"use strict";

/**
 * [{
	"unit": "f7WuNdkkvwTgpgTCMT8a0VOk/AnOBtajmJKtpYfOeuE=",
	"attestor_address": "5NN7V2PJL6446FCMDLMUAL6ZH6LG4WXW",
	"profile": {
		"username": "ramones"
	}
    }]
 * @param address
 * @param callback
 */
function selectAttestations(address, callback) {
    const network = require('ocore/network.js');
    network.requestFromLightVendor("light/get_attestations", { address }, (ws, request, attestations) => {
        callback(null, attestations);
    });
}

module.exports = {
    selectAttestations
};