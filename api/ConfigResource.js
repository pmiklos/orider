"use strict";

const express = require("express");
const router = express.Router();
const config = require("byteballcore/conf");
const constants = require("byteballcore/constants");
const device = require("byteballcore/device");

module.exports = function () {

    function isTestnet() {
        const byteballVersion = constants.version;
        return byteballVersion.endsWith("t");
    }

    router.get('/config', function (req, res, next) {
        res.json({
            authTimeout: config.authTimeout,
            byteball: {
                hub: config.hub,
                devicePubKey: device.getMyDevicePubKey(),
                protocol: isTestnet() ? "byteball-tn" : "byteball",
                explorerUrl: isTestnet() ? "https://testnetexplorer.byteball.org/" : "https://explorer.byteball.org/"
            }
        });
    });

    return router;
};
