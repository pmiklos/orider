"use strict";

const config = require("ocore/conf");
const privateProfile = require('ocore/private_profile.js');
const validation = require('ocore/validation.js');

String.prototype.toCamelCase = function () {
    return this.toLowerCase().replace(/^(.)/, function ($1) {
        return $1.toUpperCase();
    });
};

const ATTESTORS = new Map();
const REALNAME = {
    name: "Real Name Attestor",
    privateProfileRequest: "Please share your profile [Profile request](profile-request:first_name,last_name,id_type)",
    validate(profile) {
        return profile && typeof profile === "object" && typeof profile.first_name === "string" && typeof profile.last_name === "string" && typeof profile.id_type === "string"
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
};

if (config.realnameAttestor) {ATTESTORS.set(config.realnameAttestor, REALNAME);}
if (config.realnameAttestorSmartID) {ATTESTORS.set(config.realnameAttestorSmartID, REALNAME);}

function publicProfileChallenge(profileAddress, attestation) {
    const profile = attestation.profile;
    const challenge = Object.getOwnPropertyNames(profile)
        .filter(k => typeof profile[k] !== "object")
        .map(k => k + ": " + profile[k])
        .join(", ");
    return `I sign that profile address ${profileAddress} with the following public profile belongs to me: ${challenge}`;
}

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
                    let profileAddress = objSignedMessage.authors[0].address;

                    profileRepository.selectAttestations(profileAddress, (err, attestations) => {

                        let attestation = attestations.find(attestation => {
                            return attestation.profile && challenge === publicProfileChallenge(profileAddress, attestation);
                        });

                        if (!attestation) {
                            context.warn(`Invalid signature: No valid attestation found for profile ${profileAddress}`);
                            return context.reply("Invalid signature. Cannot save real name.");
                        }

                        if (!ATTESTORS.has(attestation.attestor_address)) {
                            context.warn(`Profile not accepted: unsupported attestor ${attestation.attestor_address}`);
                            return context.reply('Profile not accepted: your profile is attested by an unsupported attestor.');
                        }

                        let attestor = ATTESTORS.get(attestation.attestor_address);
                        let profile = attestation.profile;

                        if (!attestor.validate(profile)) {
                            return context.reply('Profile not accepted. Please try again and share all requested fields!');
                        }

                        accountRepository.upsertProfile(device, {
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
                    context.warn(`Profile not accepted: unsupported attestor ${attestorAddress}`);
                    return context.reply('Profile not accepted: your profile is attested by an unsupported attestor.');
                }

                let profile = privateProfile.parseSrcProfile(attestation.src_profile);
                let attestor = ATTESTORS.get(attestorAddress);

                if (!attestor.validate(profile)) {
                    return context.reply('Profile not accepted. Please try again and share all requested fields!');
                }

                privateProfile.savePrivateProfile(attestation, profileAddress, attestorAddress, (err) =>{
                    if (err) {
                        context.warn("Failed to save private profile: " + err);
                        return context.reply("Failed to save your real name.");
                    }

                    accountRepository.upsertProfile(device, {
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

                    if (attestor && attestation.profile) {
                        choices += `*  ${attestor.name}. `;

                        if (attestation.profile.profile_hash) {
                            choices += attestor.privateProfileRequest + "\n";
                        } else {
                            let challenge = publicProfileChallenge(profileAddress, attestation);
                            choices += `Please sign your profile [Signature request](sign-message-request:${challenge})\n`;
                        }
                    } else {
                        choices += `* attestor ${attestation.attestor_address} is not supported\n`
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
