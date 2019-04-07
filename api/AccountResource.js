"use strict";

module.exports = function (accountRepository, chatProcessor) {

    function accountReady(req, res, next) {
        if (req.account && req.account.payoutAddress) {
            return next();
        }

        next({
            status: 400,
            message: "Missing payout address"
        });
    }

    function fetch(req, res, next) {
        accountRepository.select(req.accessToken.dev, (err, account) => {
            if (err) return next(err);
            req.account = account;
            next();
        });
    }

    function get(req, res, next) {
        accountRepository.select(req.accessToken.dev, (err, account) => {
            if (err) return next(err);
            res.json(account);
        });
    }

    function createOrUpdate(req, res, next) {
        const updatedAccount = {
            payoutAddress: req.body.payoutAddress,
            vehicle: req.body.vehicle
        };

        accountRepository.upsert(req.accessToken.dev, updatedAccount, (err) => {
            if (err) return next(err);

            get(req, res, next);
        });
    }

    function requestKyc(req, res, next) {
        chatProcessor.requestProfile(req.accessToken.dev, err => {
            if (err) return next(err);

            res.sendStatus(200);
        });
    }

    return {
        accountReady,
        fetch,
        get,
        createOrUpdate,
        requestKyc
    };

};
