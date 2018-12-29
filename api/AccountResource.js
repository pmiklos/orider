"use strict";

const express = require("express");

module.exports = function (accountRepository) {

    function getAccount(req, res, next) {
        accountRepository.select(req.accessToken.dev, (err, account) => {
            if (err) return next(err);
            res.json(account);
        });
    }

    let accountResource = express.Router();

    accountResource.get("/account", getAccount);

    return accountResource;
};
