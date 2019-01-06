"use strict";

const constants = require("byteballcore/constants");
const device = require("byteballcore/device");


function isTestnet() {
    const byteballVersion = constants.version;
    return byteballVersion.endsWith("t");
}

const WEB_URL = isTestnet() ? "https://carpool-test.byteball.market" : "https://carpool.byteball.market";
const USAGE = `Carpooling for Byteballers
${WEB_URL}

This chat interface lets you search for rides and make reservations:

* [rides](command:rides) - list of rides
* [reservations](command:reservations) - list of your reservations
`;

module.exports = function (ridesReporsitory, reservationsRepository) {

    function listRides(context, from) {
        const fetchFrom = Number.parseInt(from) || 0;
        const fetchSize = 5;

        ridesReporsitory.selectAll(fetchFrom, fetchSize, (err, rides) => {
            if (err) return context.somethingWentWrong(err);
            if (!Array.isArray(rides)) return context.somethingWentWrong("Failed to fetch rides");

            if (rides.length > 0) {
                const listOfRides = rides.map(ride => {
                    const departure = new Date(ride.departure).toDateString();
                    const reservable = ride.status === "created" || ride.status === "boarding";
                    const reserveCmd = reservable ? `\n[reserve](command:reserve ${ride.id})` : "";
                    return `${departure} (${ride.status})\npick-up: ${ride.pickupAddress}\ndrop-off: ${ride.dropoffAddress}${reserveCmd}`;
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

        reservationsRepository.create(rideId, context.deviceAddress, (err) => {
            if (err) return context.somethingWentWrong(err);
            context.reply("Reservation successfully made. Check [reservations](command:reservations)")
        });
    }

    function listReservations(context) {
        reservationsRepository.selectAllByDevice(context.deviceAddress, (err, reservations) => {
            if (err) return context.somethingWentWrong(err);
            if (!Array.isArray(reservations)) return context.somethingWentWrong("Failed to fetch reservations");

            if (reservations.length) {
                const listOrReservations = reservations.map(reservation => {
                    const departure = new Date(reservation.departure).toDateString();
                    return `${departure}\npick-up: ${reservation.pickupAddress}\ndrop-off: ${reservation.dropoffAddress}\nstatus: ${reservation.status}`
                }).reduce((acc, curr) => {
                    return `${acc}\n\n${curr}`;
                });

                context.reply(listOrReservations);
            } else {
                context.reply("No reserverations");
            }
        });
    }

    const commands = [
        {
            pattern: /hi|hello|yo/i,
            handler(context) {
                context.reply("Hi, try [rides](command:rides) or [help](command:help) for detailed help");
            }
        }, {
            pattern: /rides|more rides ([0-9]{2})/i,
            handler: listRides
        }, {
            pattern: /reserve ([0-9]+)/i,
            handler: makeReservation
        }, {
            pattern: /reservations/i,
            handler: listReservations
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
            const context = {
                deviceAddress,
                reply,
                somethingWentWrong
            };
            args.unshift(context);
            command.handler.apply(this, args);
        } else {
            reply(USAGE);
        }
    }

    function welcome(deviceAddress) {
        device.sendMessageToDevice(deviceAddress, "text", USAGE);
    }

    return {
        answer,
        welcome
    };
};
