"use strict";

const express = require("express");
const cookieParser = require('cookie-parser');
const config = require("byteballcore/conf");
const uuid = require("uuid/v4");

const AUTH_TIMEOUT_INTERVAL = '5 MINUTES';

module.exports = function (authRepository, authEvents, tokenService) {

    function getAuthCode(req, res) {
        let authCode = "LOGIN-" + uuid();
        authRepository.insertTempPairingSecret(authCode, AUTH_TIMEOUT_INTERVAL, () => {
            res.json({
                authCode: authCode
            });
        });
    }

    function getAuthToken(req, res) {
        if (!req.body || !req.body.authCode) {
            return res.sendStatus(400);
        }

        let authCode = req.body.authCode;

        authRepository.verifyPairingSecret(authCode, (err) => {
            if (err) {
                res.sendStatus(400);
                return console.error(err);
            }

            let authTimeoutHandler = setTimeout(() => {
                if (! res.headersSent) {
                    res.sendStatus(408);
                }
                authEvents.removeAllListeners(authCode);
            }, config.authTimeout);

            authEvents.once(authCode, (authResult) => {
                clearTimeout(authTimeoutHandler);
                let accessToken = tokenService.issue({
                    dev: authResult.device
                }, "7days");
                res.cookie("access_token", accessToken, {
                    httpOnly: true,
                    secure: false // set it to true for production
                }).end();
            });
        });
    }

    function logout(req, res) {
        res.clearCookie("access_token").json({
            status: "success"
        });
    }

    let authResource = express.Router();

    authResource.use("/auth", cookieParser());
    authResource.post('/auth/init', getAuthCode);
    authResource.post('/auth/token', getAuthToken);
    authResource.post('/auth/logout', logout);

    return authResource;
};
