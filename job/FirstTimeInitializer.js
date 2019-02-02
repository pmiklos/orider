"use strict";
const config = require("ocore/conf");

module.exports = function(headlessWallet, rideFeeContract) {

    function defineRideFeeContractTemplate() {
        rideFeeContract.defineTemplate(headlessWallet, (err, templateHash) => {
            if (err) {
                console.error("[INIT] Failed to create contract template: " + err);
                console.error("[INIT] Retrying in 30sec");
                return setTimeout(defineRideFeeContractTemplate, 30000);
            }

            console.error(`[INIT] Contract template created. Save it in conf.json and restart: \n\t"rideFeeContractTemplate": "${templateHash}"`);
            process.exit(0);
        });
    }

    return {

        start(callback) {
            if (config.rideFeeContractTemplate) {
                return callback();
            }
            defineRideFeeContractTemplate();
        }

    }

};
