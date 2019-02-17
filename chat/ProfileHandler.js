"use strict";

const chash = require('ocore/chash.js');
const config = require("ocore/conf");
const privateProfile = require('ocore/private_profile.js');

const ATTESTORS = new Map();

String.prototype.toCamelCase = function() {
    return this.toLowerCase().replace(/^(.)/, function($1) { return $1.toUpperCase(); });
};

ATTESTORS.set(config.realnameAttestor, {
    name: "Real Name Attestor",
    privateProfileRequest: "Please share your first and last name [Profile request](profile-request:first_name,last_name)",

    validate(profile) {
        return typeof profile.first_name === "string" && typeof profile.last_name === "string"
    },

    firstName(profile) {
        return profile.first_name.toCamelCase();
    },

    lastName(profile) {
        return profile.last_name.toCamelCase();
    }
});


module.exports = function (web, accountRepository, profileRepository) {

    function notifyAccountUpdated(account) {
        web.send({
            id: account.device,
            event: "accountUpdated",
            data: account
        });
    }

    return {

        handlePrivateProfile(context, privateProfileJsonBase64) {
            let device = context.deviceAddress;

            let profileUnit = privateProfile.getPrivateProfileFromJsonBase64(privateProfileJsonBase64);

            if (!profileUnit) {
                context.warn('Invalid profile: failed to decode');
                return context.reply('Invalid profile. Issuer creation is not possible.');
            }

            privateProfile.parseAndValidatePrivateProfile(profileUnit, function (err, address, attestor_address) {
                if (err) {
                    context.warn('Invalid profile: ' + err);
                    return context.reply('Invalid profile. Real name cannot be saved.');
                }

                if (!ATTESTORS.has(attestor_address)) {
                    context.warn('Profile not accepted: untrusted attestor');
                    return context.reply('Profile not accepted: your profile is attested by an untrusted attestor.');
                }

                let profile = privateProfile.parseSrcProfile(profileUnit.src_profile);
                let attestor = ATTESTORS.get(attestor_address);

                if (!attestor.validate(profile)) {
                    return context.reply('Profile not accepted. Please try again and share all requested fields!');
                }

                const firstName = attestor.firstName(profile);
                const lastName = attestor.lastName(profile);

                accountRepository.updateName(device, firstName, lastName, function (err) {
                    if (err) {
                        context.warn('Failed to save: ' + err);
                        return context.reply(`Failed to save your real name.`);
                    }
                    context.log(`Attested ${address} by ${attestor.name}`);
                    context.reply(`Thank you. Attested profile found for address ${address} Your real name is saved as ${firstName} ${lastName}`);

                    accountRepository.select(device, (err, account) => {
                        if (err) return context.warn("Failed to send accountUpdated to web");
                        notifyAccountUpdated(account);
                    });
                });

            });

        },

        setProfileAddress(context, profileAddress) {
            console.error("Received profile " + profileAddress);

            context.resetMemory();

            profileRepository.selectAttestations(profileAddress, (err, attestations) => {
                if (err) context.somethingWentWrong(err);

                console.error(JSON.stringify(attestations));

                let choices = "Select a method to prove your identity:\n";

                attestations.forEach(attestation => {
                    const attestor = ATTESTORS.get(attestation.attestor_address);

                    choices += `*  ${attestor.name}. `;

                    if (attestation.profile && attestation.profile.profile_hash) {
                        choices += attestor.privateProfileRequest + "\n";
                    } else {
                        let challenge = chash.getChash288(attestation.attestor_address + profileAddress);
                        choices += `Please sign your profile [Signature request](sign-message-request:${challenge})\n`;
                    }
                });

                if (attestations.length > 0) {
                    return context.reply(choices);
                }

                context.reply("Your profile is not attested.");
            });
        }

    };

};
