"use strict";

const constants = require("ocore/constants");
const config = require("ocore/conf");
const device = require("ocore/device");

const ProfileHandler = require("./ProfileHandler");

// TODO make it reusable
function isTestnet() {
    const byteballVersion = constants.version;
    return byteballVersion.endsWith("t");
}

// TODO make it reusable
const WEB_URL = isTestnet() ? "https://carpool-test.byteball.market" : "https://orider.obyte.app";
const USAGE = `Carpooling with ORider
${WEB_URL}

This chat interface lets you search for rides and make reservations:

* [rides](command:rides) - list of rides
* [reservations](command:reservations) - list of your reservations

To set your payout/refund address, simply insert your address.
`;

const REQUEST_PROFILE = 'REQ_PROFILE';

module.exports = function (web, accountRepository, profileRepository, ridesReporsitory, reservationsRepository) {

    const contextMemory = new Map();
    const profileHandler = ProfileHandler(web, accountRepository, profileRepository);

    function listRides(context, from) {
        const fetchFrom = Number.parseInt(from) || 0;
        const fetchSize = 5;

        ridesReporsitory.selectAll(fetchFrom, fetchSize, (err, rides) => {
            if (err) return context.somethingWentWrong(err);
            if (!Array.isArray(rides)) return context.somethingWentWrong("Failed to fetch rides");

            if (rides.length > 0) {
                const listOfRides = rides.map(ride => {
                    const departureDate = new Date(ride.departure).toDateString();
                    const departureTime = new Date(ride.departure).toTimeString();
                    const reserved = ride.reservationDevices && ride.reservationDevices.includes(context.deviceAddress);
                    const reservable = ride.status === "created" || ride.status === "boarding";
                    const reserveCmd = reservable ? `\n[reserve](command:reserve ${ride.id})` : "";

                    return `${departureDate} (${ride.status})\n`
                        + `${departureTime}\n`
                        + `pick-up: ${ride.pickupAddress}\n`
                        + `drop-off: ${ride.dropoffAddress}`
                        + `${reserved ? "\nReserved" : reserveCmd}`
                }).reduce((acc, curr) => {
                    return acc + "\n\n" + curr;
                });

                if (rides.length < fetchSize) {
                    context.reply(listOfRides);
                } else {
                    context.reply(listOfRides + `\n[more](command:more rides ${fetchFrom + rides.length})`);
                }
            } else {
                context.reply("No more rides.");
            }
        });
    }

    function makeReservation(context, rideIdArg) {
        const rideId = Number.parseInt(rideIdArg);

        accountRepository.select(context.deviceAddress, (err, account) => {
            if (err) return context.somethingWentWrong(err);
            if (!account || !account.payoutAddress) return context.reply("To make a reservation please enter a payout address below. Incomplete rides will be refunded to this address");

            reservationsRepository.create(rideId, context.deviceAddress, (err) => {
                if (err) return context.somethingWentWrong(err);
                context.reply("Reservation successfully made. Check [reservations](command:reservations)")
            });
        });
    }

    function listReservations(context) {
        reservationsRepository.selectAllByDevice(context.deviceAddress, (err, reservations) => {
            if (err) return context.somethingWentWrong(err);
            if (!Array.isArray(reservations)) return context.somethingWentWrong("Failed to fetch reservations");

            if (reservations.length) {
                const listOrReservations = reservations.map(reservation => {
                    const departureDate = new Date(reservation.departure).toDateString();
                    const departureTime = new Date(reservation.departure).toTimeString();
                    const checkedIn = reservation.status === "checkedin";
                    const completeCmd = checkedIn ? `\n${WEB_URL}/#!/my/reservations/${reservation.rideId}`:"";
                    return `${departureDate} ${departureTime}\n`
                        + `pick-up: ${reservation.pickupAddress}\n`
                        + `drop-off: ${reservation.dropoffAddress}\n`
                        + `status: ${reservation.status}`
                        + completeCmd;
                }).reduce((acc, curr) => {
                    return `${acc}\n\n${curr}`;
                });

                context.reply(listOrReservations);
            } else {
                context.reply("No reserverations");
            }
        });
    }

    function setPayoutAddress(context, payoutAddress) {
        accountRepository.upsert(context.deviceAddress, { payoutAddress }, (err) => {
            if (err) return context.somethingWentWrong(err);
            context.reply("Your payout address is set to " + payoutAddress);
        });
    }

    function handleAddress(context, address) {
        if (context.request && context.request === REQUEST_PROFILE) {
            profileHandler.setProfileAddress(context, address);
        } else {
            setPayoutAddress(context, address);
        }
    }

    const commands = [
        {
            pattern: /hi|hello|yo/i,
            handler(context) {
                context.reply("Hi, try [rides](command:rides) or [help](command:help) for detailed help");
            }
        }, {
            pattern: /^rides|^more rides ([0-9]{1,2})/i,
            handler: listRides
        }, {
            pattern: /reserve ([0-9]+)/i,
            handler: makeReservation
        }, {
            pattern: /reservations/i,
            handler: listReservations
        }, {
            pattern: /([A-Z2-7]{32})/,
            handler: handleAddress
        }, {
            pattern: /\[.+?\]\(profile:(.+?)\)/,
            handler: profileHandler.handlePrivateProfile
        }];

    function answer(deviceAddress, answer) {
        const command = commands.find((command) => command.pattern.test(answer));

        const reply = function (message) {
            device.sendMessageToDevice(deviceAddress, "text", message);
        };

        const somethingWentWrong = function (err) {
            console.error(`[CHAT] ${deviceAddress}: ${err}`);
            device.sendMessageToDevice(deviceAddress, "text", "Something went wrong. Please try again.");
        };

        if (command) {
            const matches = answer.match(command.pattern);
            const args = matches.slice(1, matches.length);
            const oldContext = contextMemory.get(deviceAddress) || {};
            const newContext = {
                deviceAddress,
                reply,
                somethingWentWrong,
                resetMemory() {
                    contextMemory.delete(deviceAddress);
                },
                log(msg) {
                    console.warn(`[${deviceAddress}]: ` + msg);
                },
                warn(msg) {
                    console.warn(`[${deviceAddress}] "${answer}": ` + msg);
                }
            };
            args.unshift({ ...oldContext, ...newContext });
            command.handler.apply(this, args);
        } else {
            reply(USAGE);
        }
    }

    /**
     * @param {string} deviceAddress - the user device from which the profile is requested
     */
    function requestProfile(deviceAddress, callback) {
        contextMemory.set(deviceAddress, {
           request: REQUEST_PROFILE
        });
        device.sendMessageToDevice(deviceAddress, "text", "Please insert your profile address attested by the real name attestor.");

        callback();
    }

    function welcome(deviceAddress) {
        device.sendMessageToDevice(deviceAddress, "text", USAGE);
    }

    return {
        answer,
        requestProfile,
        welcome
    };
};
