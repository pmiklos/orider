"use strict";

const events = require("events");
const cookieParser = require('cookie-parser');
const express = require("express");

const authEvents = new events.EventEmitter();

const tokenService = require("../common/TokenService");

const accountRepository = require("./AccountRepository");
const authRepository = require("./AuthRepository");
const ridesRepository = require("./RidesRepository");
const reservationsRepository = require("./ReservationsRepository");

const AccountResource = require("./AccountResource");
const authResource = require("./AuthResource");
const CompletionScoring = require("./CompletionScoring");
const configResource = require("./ConfigResource");
const RidesResource = require("./RidesResource");
const ReservationsResource = require("./ReservationsResource");

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

module.exports = function (webapp, mapService) {

    const completionScoring = CompletionScoring(mapService);
    const accountResource = AccountResource(accountRepository);
    const ridesResource = RidesResource(ridesRepository, reservationsRepository, authRepository, mapService, completionScoring);
    const reservationsResource = ReservationsResource(reservationsRepository, ridesRepository, completionScoring);

    webapp.use("/api", express.json());
    webapp.use("/api", requestLogger);
    webapp.use("/api", authResource(authRepository, authEvents, tokenService));
    webapp.use("/api", configResource());
    webapp.post("/api/*", cookieParser());
    webapp.post("/api/*", accessTokenResolver);
    webapp.get("/api/my/*", cookieParser());
    webapp.get("/api/my/*", accessTokenResolver);
    webapp.get("/api/my/account", accountResource.get);
    webapp.post("/api/my/account", accountResource.createOrUpdate);
    webapp.get("/api/my/reservations", reservationsResource.listByDevice);
    webapp.get("/api/my/reservations/:id", reservationsResource.get);
    webapp.post("/api/my/reservations/:id/complete", reservationsResource.complete);
    webapp.get("/api/my/rides", ridesResource.listByDevice);
    webapp.use("/api/my/rides/:id", ridesResource.fetchMine);
    webapp.get("/api/my/rides/:id", ridesResource.get);
    webapp.get("/api/my/rides/:id/reservations", reservationsResource.listByRide);
    webapp.post("/api/my/rides/:id/board", ridesResource.board);
    webapp.post("/api/my/rides/:id/complete", ridesResource.complete);
    webapp.get("/api/rides", ridesResource.list);
    webapp.post("/api/rides", accountResource.fetch);
    webapp.post("/api/rides", accountResource.accountReady);
    webapp.post("/api/rides", ridesResource.create);
    webapp.use("/api/rides/:id", ridesResource.fetch);
    webapp.get("/api/rides/:id/reservations", reservationsResource.listByRide);
    webapp.post("/api/rides/:id/reservations", reservationsResource.create);

    webapp.use(errorHandler);

    return {
        onAuthenticated(event) {
            authEvents.emit(event.id, event.data);
        },
        accountRepository,
        reservationsRepository,
        ridesRepository
    }
};