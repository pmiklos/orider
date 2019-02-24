(function() {

    var byteball = function(config) {

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
    };

    var app = angular.module("carpool");
    app.factory('byteball', ["CONFIG", byteball]);

}());
