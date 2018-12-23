"use strict";

const config = require("byteballcore/conf");
const device = require("byteballcore/device");
const eventBus = require("byteballcore/event_bus");
const headlessWallet = require("headless-byteball");
const express = require("express");
const http = require("http");
const socketio = require('socket.io');


const Web = require("./web/Web");
const Api = require("./api/Api");

const httpPort = process.env.PORT || 8080;
const httpHost = process.env.IP || "127.0.0.1";

const webapp = express();
const httpServer = http.Server(webapp);
const ws = socketio(httpServer);
const web = Web(webapp, ws);
const api = Api(webapp);

eventBus.once("headless_wallet_ready", () => {

    httpServer.listen(httpPort, httpHost, () => {
        console.error("WEB started");
    });

    eventBus.on("paired", (from_address, pairing_secret) => {
        if (pairing_secret === config.permanent_paring_secret) {
            return device.sendMessageToDevice(from_address, "text", "Welcome to Carpooling for Byteballers");
        }

        api.onAuthenticated({
            id: pairing_secret,
            data: {
                device: from_address
            }
        });

        device.sendMessageToDevice(from_address, "text", "Successfully logged in");
    } );

});
