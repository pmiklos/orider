"use strict";

const accountRepository = require("./sqlite/AccountRepository");
const authRepository = require("./sqlite/AuthRepository");
const reservationsRepository = require("./sqlite/ReservationsRepository");
const ridesRepository = require("./sqlite/RidesRepository");

module.exports.Sqlite = {
    accountRepository,
    authRepository,
    reservationsRepository,
    ridesRepository
};
