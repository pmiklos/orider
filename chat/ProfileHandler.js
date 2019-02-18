"use strict";

const chash = require('ocore/chash.js');
const config = require("ocore/conf");
const privateProfile = require('ocore/private_profile.js');
const validation = require('ocore/validation.js');

const ATTESTORS = new Map();

String.prototype.toCamelCase = function () {
    return this.toLowerCase().replace(/^(.)/, function ($1) {
        return $1.toUpperCase();
    });
};

ATTESTORS.set(config.realnameAttestor, {
    name: "Real Name Attestor",
    privateProfileRequest: "Please share your first and last name [Profile request](profile-request:first_name,last_name,id_type)",

    validate(profile) {
        return typeof profile.first_name === "string" && typeof profile.last_name === "string" && typeof profile.id_type === "string"
    },

    firstName(profile) {
        return profile.first_name.toCamelCase();
    },

    lastName(profile) {
        return profile.last_name.toCamelCase();
    },

    isDriversLicense(profile) {
        return profile.id_type === "DRIVING_LICENSE";
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

        handlePublicProfile(context, signedMessageBase64) {
            let device = context.deviceAddress;

            context.warn("signedMessageBase64: %s", signedMessageBase64);

            let signedMessageJson = Buffer(signedMessageBase64, 'base64').toString('utf8');
            try {
                context.warn("signedMessageJson: %s", signedMessageJson);
                let objSignedMessage = JSON.parse(signedMessageJson);

                validation.validateSignedMessage(objSignedMessage, err => {
                    if (err) {
                        context.warn("Failed to validate attestation by signature: %s", err);
                        return context.reply("Invalid signature. Cannot save real name.");
                    }

                    let challenge = objSignedMessage.signed_message;

                    if (!chash.isChashValid(challenge)) {
                        context.warn("Invalid signature: %s" + hash);
                        return context.reply("Invalid signature. Cannot save real name.");
                    }

                    let profileAddress = objSignedMessage.authors[0].address;

                    profileRepository.selectAttestations(profileAddress, (err, attestations) => {

                        let attestation = attestations.find(attestation => {
                            return challenge === chash.getChash288(attestation.attestor_address + profileAddress);
                        });

                        if (attestation) {
                            let attestor = ATTESTORS.get(attestation.attestor_address);
                            let profile = attestation.profile;

                            accountRepository.updateProfile(device, {
                                unit: attestation.unit,
                                firstName: attestor.firstName(profile),
                                lastName: attestor.lastName(profile),
                                isDriversLicense: attestor.isDriversLicense(profile)
                            }, function (err) {
                                if (err) {
                                    context.warn('Failed to save: ' + err);
                                    return context.reply(`Failed to save your real name.`);
                                }
                                context.log(`Attested ${profileAddress} by ${attestor.name}`);

                                accountRepository.select(device, (err, account) => {
                                    if (err) return context.warn("Failed to send accountUpdated to web");
                                    notifyAccountUpdated(account);
                                    context.reply(`Thank you. Attested profile found for address ${profileAddress} Your real name is saved as ${account.fullName}`);
                                });
                            });
                        } else {
                            context.warn("Invalid signature: No valid attestation found for profile %s", profileAddress);
                            context.reply("Invalid signature. Cannot save real name.");
                        }
                    });
                });
            }
            catch (e) {
                console.error(e);
                context.reply("Invalid signature. Cannot save real name.");
            }
        },

        handlePrivateProfile(context, privateProfileJsonBase64) {
            let device = context.deviceAddress;

            let attestation = privateProfile.getPrivateProfileFromJsonBase64(privateProfileJsonBase64);

            if (!attestation) {
                context.warn('Invalid profile: failed to decode');
                return context.reply('Invalid profile. Real name cannot be saved.');
            }

            privateProfile.parseAndValidatePrivateProfile(attestation, function (err, profileAddress, attestorAddress) {
                if (err) {
                    context.warn('Invalid profile: ' + err);
                    return context.reply('Invalid profile. Real name cannot be saved.');
                }

                if (!ATTESTORS.has(attestorAddress)) {
                    context.warn('Profile not accepted: untrusted attestor');
                    return context.reply('Profile not accepted: your profile is attested by an untrusted attestor.');
                }

                let profile = privateProfile.parseSrcProfile(attestation.src_profile);
                let attestor = ATTESTORS.get(attestorAddress);

                if (!attestor.validate(profile)) {
                    return context.reply('Profile not accepted. Please try again and share all requested fields!');
                }

                accountRepository.updateProfile(device, {
                    unit: attestation.unit,
                    firstName: attestor.firstName(profile),
                    lastName: attestor.lastName(profile),
                    isDriversLicense: attestor.isDriversLicense(profile)
                }, function (err) {
                    if (err) {
                        context.warn('Failed to save: ' + err);
                        return context.reply(`Failed to save your real name.`);
                    }
                    context.log(`Attested ${profileAddress} by ${attestor.name}`);

                    accountRepository.select(device, (err, account) => {
                        if (err) return context.warn("Failed to send accountUpdated to web");
                        notifyAccountUpdated(account);
                        context.reply(`Thank you. Attested profile found for address ${profileAddress} Your real name is saved as ${account.fullName}`);
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
