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
const RideFeeContract = require("./contract/RideFeeContract");
const CarpoolOracle = require("./job/CarpoolOracle");
const PayoutProcessor = require("./job/PayoutProcessor");
const PaymentProcessor = require("./job/PaymentProcessor");
const ChatProcessor = require("./job/ChatProcessor");
const mapService = require("./common/MapService");

const httpPort = process.env.PORT || 8080;
const httpHost = process.env.IP || "127.0.0.1";

const webapp = express();
const httpServer = http.Server(webapp);
const ws = socketio(httpServer);
const web = Web(webapp, ws);
const api = Api(webapp, mapService);

eventBus.once("headless_wallet_ready", () => {

    headlessWallet.issueOrSelectStaticChangeAddress((address) => {
        const payoutProcessorDevice = device.getMyDeviceAddress();
        const payoutProcessorAddress = address;
        const carpoolOracleAddress = address;
        const rideFeeContract = RideFeeContract(payoutProcessorDevice, payoutProcessorAddress, carpoolOracleAddress);
        const carpoolOracle = CarpoolOracle(carpoolOracleAddress, headlessWallet, api.ridesRepository);

        console.error("Carpool oracle address: " + carpoolOracleAddress);

        carpoolOracle.start();
        start(rideFeeContract);
    });

});

function start(rideFeeContract) {

    const chatProcessor = ChatProcessor(api.ridesRepository, api.reservationsRepository);

    httpServer.listen(httpPort, httpHost, () => {
        console.error("WEB started");
    });

    eventBus.on("paired", (from_address, pairing_secret) => {
        if (pairing_secret === config.permanent_pairing_secret) {
            return chatProcessor.welcome(from_address);
        }
    });

    eventBus.on("paired", (from_address, pairing_secret) => {
        if (pairing_secret.startsWith("LOGIN-")) {
            console.log(`[${from_address}] Logging in using ${pairing_secret}`);

            api.onAuthenticated({
                id: pairing_secret,
                data: {
                    device: from_address
                }
            });
            device.sendMessageToDevice(from_address, "text", "Successfully logged in");
        }
    });

    eventBus.on("paired", (from_address, pairing_secret) => {
        if (pairing_secret.startsWith("CHECKIN-")) {
            console.log(`[${from_address}] Checking in using ${pairing_secret}`);

            const checkInCode = pairing_secret.substring(8);

            api.ridesRepository.selectByCheckInCode(checkInCode, (err, ride) => {
                if (err) {
                    console.error(`[${from_address}] Failed to check in with ${checkInCode}: ${err}`);
                    return device.sendMessageToDevice(from_address, "text", "Something went wrong, try to check in again.");
                }

                api.reservationsRepository.select(ride.id, from_address, (err, reservation) => {
                    if (err) {
                        console.error(`[${from_address}] Failed to check in with ${checkInCode}: ${err}`);
                        return device.sendMessageToDevice(from_address, "text", "Something went wrong, try to check in again.");
                    }

                    rideFeeContract.define({
                        rideId: ride.id,
                        driverDevice: ride.device,
                        driverPayoutAddress: ride.payoutAddress,
                        passengerDevice: from_address,
                        passengerRefundAddress: reservation.payoutAddress,
                        amount: ride.pricePerSeat
                    }, (err, contractAddress, definition) => {
                        if (err) {
                            console.error(`[${from_address}] Failed to check in with ${checkInCode}, contract failed: ${err}`);
                            return device.sendMessageToDevice(from_address, "text", "Something went wrong, try to check in again.");
                        }

                        api.reservationsRepository.checkin(ride.id, from_address, contractAddress, (err) => {
                            if (err) {
                                console.error(`[${from_address}] Failed to check in for ride ${ride.id}: ${err}`);
                                return device.sendMessageToDevice(from_address, "text", "Something went wrong, try to check in again.");
                            }

                            web.send({
                                id: ride.device,
                                event: "checkin",
                                data: {
                                    device: from_address
                                }
                            });

                            device.sendMessageToDevice(from_address, "text", "You checked in for the ride");

                            const payments = [{
                                address: contractAddress,
                                amount: ride.pricePerSeat,
                                asset: 'base'
                            }];

                            const definitions = {};
                            definitions[contractAddress] = definition;

                            const paymentJson = JSON.stringify({payments, definitions});
                            const paymentJsonBase64 = Buffer(paymentJson).toString('base64');
                            const paymentRequestCode = 'payment:' + paymentJsonBase64;
                            const paymentRequestText = `[Please pay the fee for the ride](${paymentRequestCode})`;

                            device.sendMessageToDevice(from_address, "text", paymentRequestText);
                        });
                    });
                });
            });
        }
    });

    eventBus.on("text", chatProcessor.answer);

    const paymentProcessor = PaymentProcessor(web, api.ridesRepository, api.reservationsRepository);
    const payoutProcessor = PayoutProcessor(headlessWallet, api.ridesRepository, api.reservationsRepository);

    eventBus.on("new_my_transactions", paymentProcessor.reservationsReceived);
    eventBus.on("my_transactions_became_stable", payoutProcessor.payoutRides);
}
