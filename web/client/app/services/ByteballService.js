(function() {

    var app = angular.module("carpool");

    const KBYTE = 1000;
    const MBYTE = 1000 * KBYTE;
    const GBYTE = 1000 * MBYTE;

    app.factory('byteball', ["CONFIG", function(config) {

        var explorerUrl = function(hash) {
            return config.byteball.explorerUrl + "#" + hash;
        };

        var requestPaymentUrl = function(address, amount, asset = "base") {
            return config.byteball.protocol + ":" + address + "?amount=" + amount + "&asset=" + asset;
        };

        var pairingCode = function(pairingSecret) {
            return config.byteball.devicePubKey + "@" + config.byteball.hub + "#" + pairingSecret;
        };

        var pairingUrl = function(pairingCode) {
            return config.byteball.protocol + ":" + pairingCode;
        };

        var redirectUrl = pairingUrl(pairingCode(config.byteball.redirectCode));

        return {
            explorerUrl,
            requestPaymentUrl,
            pairingCode,
            pairingUrl,
            redirectUrl
        };
    }]);

    app.filter("GBYTE", function() {
        return function(amount) {
            return amount / GBYTE;
        };
    });

    app.filter("MBYTE", function() {
        return function(amount) {
            return amount / MBYTE;
        };
    });

    app.filter("paymentUrl", ["byteball", function(byteball) {
        return function(payment) {
            if (typeof payment === 'object') {
                return byteball.requestPaymentUrl(payment.address, payment.amount, payment.asset);
            }
            return "";
        };
    }]);

    app.filter("explorerUrl", ["byteball", function(byteball) {
        return function(unitOrAddress) {
            if (typeof unitOrAddress === 'string') {
                return byteball.explorerUrl(unitOrAddress);
            }
            return "";
        };
    }]);

}());
