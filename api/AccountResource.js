"use strict";

module.exports = function (accountRepository) {

    function get(req, res, next) {
        accountRepository.select(req.accessToken.dev, (err, account) => {
            if (err) return next(err);
            res.json(account);
        });
    }

    function createOrUpdate(req, res, next) {
        const updatedAccount = {
            payoutAddress: req.body.payoutAddress
        };

        accountRepository.upsert(req.accessToken.dev, updatedAccount, (err) => {
            if (err) return next(err);

            get(req, res, next);
        });
    }

    return {
        get,
        createOrUpdate
    };

};
