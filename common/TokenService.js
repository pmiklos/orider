"use strict";

const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const config = require("ocore/conf");

const secret = config.authSecret;
const issuer = "byteball-carpool";

function issue(payload, expiresIn) {
    return jwt.sign(payload, secret, {
        jwtid: uuid(),
        issuer: issuer,
        expiresIn: expiresIn
    });
}

function verify(token, callback) {
    jwt.verify(token, secret, {issuer: issuer}, callback);
}

module.exports.issue = issue;
module.exports.verify = verify;
