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

        return {
            explorerUrl: explorerUrl,
            requestPaymentUrl: requestPaymentUrl,
            pairingCode: pairingCode,
            pairingUrl: pairingUrl
        };
    };

    var app = angular.module("carpool");
    app.factory('byteball', ["CONFIG", byteball]);

}());
