"use strict";
const walletDefinedByAddresses = require("ocore/wallet_defined_by_addresses");

const RIDE_STATUS_DATAFEED = "RIDE_STATUS";

/**
 * The estimated fee of making a transfer out of the contract
 * @type {number}
 */
const TYPICAL_FEE = 1500; // TODO could be lowered significantly by using definition templates I think

function hasOutput(address, asset, amount) {
    return ["has", {
        what: "output",
        asset: asset,
        amount_at_least: amount,
        address: address
    }];
}

/**
 * @param {string} payoutProcessorDevice - BASE32 address of the device (the bot) that pays out the driver or refunds the passenger
 * @param {string} payoutProcessorAddress - BASE32 address of the author address that pays out the driver or refunds the passenger
 * @param {string} carpoolOracleAddress - BASE32 address of the oracle that post trip completion status
 * @returns {{define(RideFeeContractParams, RideFeeCallback): void}}
 */
module.exports = function (payoutProcessorDevice, payoutProcessorAddress, carpoolOracleAddress) {

    return {

        /**
         * @typedef {Object} RideFeeContractParams
         * @property {number} rideId - the ride identifier that will be included in the oracle datafeed when the trip completes
         * @property {string} driverDevice - the BASE32 address of the driver's device
         * @property {string} driverPayoutAddress - the BASE32 address of the driver to which the ride fee is paid out on trip completion
         * @property {string} passengerDevice - the BASE32 address of the passenger's device
         * @property {string} passengerRefundAddress - the BASE32 address of the passenger to which the ride fee is refunded if the trip didn't complete
         * @property {number} amount - the price of the ride in bytes
         */

        /**
         * @callback RideFeeCallback
         * @param {(string|null)} err - the error message if creating the contract failed
         * @param {string=} contractAddress - the BASE32 address of the ride fee contract
         * @param {Object=} contractDefinition - the definition of the ride fee contract
         */

        /**
         * @param {RideFeeContractParams} p
         * @param {RideFeeCallback} callback
         */
        define(p, callback) {
            const definition = [
                "or", [
                    ["and", [
                        ["address", payoutProcessorAddress], // r.0.0
                        hasOutput(p.driverPayoutAddress, 'base', p.amount - TYPICAL_FEE),
                        ["in data feed", [
                            [carpoolOracleAddress],
                            RIDE_STATUS_DATAFEED, "=", `RIDE-${p.rideId}-COMPLETED`
                        ]]
                    ]],
                    ["and", [
                        ["address", payoutProcessorAddress], // r.1.0
                        hasOutput(p.passengerRefundAddress, 'base', p.amount - TYPICAL_FEE),
                        ["in data feed", [
                            [carpoolOracleAddress],
                            RIDE_STATUS_DATAFEED, "=", `RIDE-${p.rideId}-INCOMPLETE`
                        ]]
                    ]],
                    ["and", [
                        ["address", p.driverPayoutAddress], // r.2.0
                        ["in data feed", [
                            [carpoolOracleAddress],
                            RIDE_STATUS_DATAFEED, "=", `RIDE-${p.rideId}-COMPLETED`
                        ]]
                    ]],
                    ["and", [
                        ["address", p.passengerRefundAddress], // r.3.0
                        ["in data feed", [
                            [carpoolOracleAddress],
                            RIDE_STATUS_DATAFEED, "=", `RIDE-${p.rideId}-INCOMPLETE`
                        ]]
                    ]]
                ]
            ];

            let signers = {
                "r.0.0": {
                    address: payoutProcessorAddress,
                    member_signing_path: "r",
                    device_address: payoutProcessorDevice
                },
                "r.1.0": {
                    address: payoutProcessorAddress,
                    member_signing_path: "r",
                    device_address: payoutProcessorDevice
                },
                "r.2.0": {
                    address: p.driverPayoutAddress,
                    member_signing_path: "r",
                    device_address: p.driverDevice
                },
                "r.3.0": {
                    address: p.passengerRefundAddress,
                    member_signing_path: "r",
                    device_address: p.passengerDevice
                }
            };

            walletDefinedByAddresses.createNewSharedAddress(definition, signers, {
                ifError: function (err) {
                    callback(err);
                },
                ifOk: function (contractAddress) {
                    callback(null, contractAddress, {definition, signers});
                }
            });
        }

    };
};