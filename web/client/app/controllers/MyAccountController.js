(function () {

    var app = angular.module("carpool");

    app.controller("MyAccountController", ["$rootScope", "$scope", "$route", "$location", "byteball", "socket", "AccountService",
        function ($rootScope, $scope, $route, $location, byteball, socket, AccountService) {

            $scope.payoutAddress = $rootScope.account.payoutAddress;

            function updateAccount() {
                AccountService.update({
                    payoutAddress: $scope.payoutAddress
                }).then(function (account) {
                    $scope.payoutAddress = account.payoutAddress;
                    $rootScope.setAccount(account);
                    $rootScope.showInfo("Account updated", 3000);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to update account", 5000);
                });
            }

            function requestKyc() {
                AccountService.requestKyc().then(function() {
                    $rootScope.showInfo({
                        text: "Real name request sent. Please check your messages in your Obyte wallet!",
                        href: byteball.redirectUrl,
                        link: "Open wallet"
                    }, 7000);
                }, function (error) {
                    console.error(error);
                    $rootScope.showError("Failed to request real name", 5000);
                });
            }

            socket.on("accountUpdated", function(account) {
                $rootScope.setAccount(account);
                $rootScope.showInfo("Account updated", 3000);
            });

            $scope.updateAccount = updateAccount;
            $scope.requestKyc = requestKyc;
        }]);

})();
