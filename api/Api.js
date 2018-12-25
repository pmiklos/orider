"use strict";

const events = require("events");
const cookieParser = require('cookie-parser');
const express = require("express");

const authEvents = new events.EventEmitter();

const tokenService = require("../common/TokenService");

const accountRepository = require("./AccountRepository");
const authRepository = require("./AuthRepository");

const accountResource = require("./AccountResource");
const authResource = require("./AuthResource");
const configResource = require("./ConfigResource");


function requestLogger(req, res, next) {
    console.error(`API: ${req.method} ${req.url} ${JSON.stringify(req.body)}`);
    next();
}

function errorHandler(err, req, res, next) {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    if (typeof err === "object") {
        res.status(err.status);
        res.json({error: err.message});
    } else {
        res.status(500);
        res.json({error: "Server Error"});
    }
}

function accessTokenResolver(req, res, next) {
    if (req.cookies && req.cookies.access_token) {
        tokenService.verify(req.cookies.access_token, (err, payload) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.accessToken = payload;
            next();
        });
    } else {
        return res.sendStatus(401);
    }
}

module.exports = function (webapp) {

    webapp.use("/api", express.json());
    webapp.use("/api", requestLogger);
    webapp.use("/api", authResource(authRepository, authEvents, tokenService));
    webapp.use("/api", configResource());
    webapp.use("/api/my", cookieParser());
    webapp.use("/api/my", accessTokenResolver);
    webapp.use("/api/my", accountResource(accountRepository));
    webapp.use(errorHandler);

    return {
        onAuthenticated(event) {
            authEvents.emit(event.id, event.data);
        }
    }
};