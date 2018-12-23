"use strict";

const path = require('path');
const cookieParser = require('cookie-parser');
const express = require("express");

const tokenService = require("../common/TokenService");

const sockets = {};

function requestLogger(req, res, next) {
    console.error(`WEB: ${req.method} ${req.url}`);
    next();
}

function errorHandler(err, req, res, next) {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500);
    res.send("Server Error");
}

function ioMiddleware(expressMiddleware) {
    return (socket, next) => expressMiddleware(socket.handshake, {}, next);
}

function registerDevice(socket) {
    if (socket.handshake.cookies && socket.handshake.cookies.access_token) {
        tokenService.verify(socket.handshake.cookies.access_token, (err, payload) => {
            if (err) {
                console.error("[ws:connection] Invalid token");
                return;
            }
            console.log("[ws] Registering device: " + payload.dev);
            sockets[payload.dev] = socket;
        });
    }
}

function unregisterDevice(socket) {
    if (socket.handshake.cookies && socket.handshake.cookies.access_token) {
        tokenService.verify(socket.handshake.cookies.access_token, (err, payload) => {
            if (err) {
                console.error("[ws:disconnect] Invalid token");
                return;
            }
            if (sockets[payload.dev]) {
                console.log("[ws] Unregistering device: " + payload.dev);
                delete sockets[payload.dev];
            }
        });
    }
}

module.exports = function(webapp, ws) {

    webapp.use(requestLogger);
    webapp.use("/", express.static(__dirname + "/client"));
    webapp.use(errorHandler);

    ws.use(ioMiddleware(cookieParser()));
    ws.on("connection", (socket) => {
        console.log("[ws] Connected " + socket.id);
        registerDevice(socket);

        socket.on("disconnect", () => {
            console.log("[ws] Disconnected " + socket.id);
            unregisterDevice(socket)
        });
    });

    function send(event) {
        let device = event.id;

        if (sockets[device]) {
            sockets[device].emit(event.event, event.data);
        } else {
            console.error(`[ws] Failed to deliver ${event.event} to ${device}. Device not registered.`);
            console.log(`Registered devices: ${Object.keys(sockets)}`);
        }
    }

    return {
        send
    };
};
