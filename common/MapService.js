"use strict";

const config = require("byteballcore/conf");
const geodatasource = require("./geodatasource");
const googleMapsClient = require('@google/maps').createClient({
    key: config.googleMapsApiKey
});

function geocode(address, callback) {
    googleMapsClient.geocode({address}, (err, response) => {
        if (err) return callback(err);
        if (response.json.status !== "OK") return callback(err);
        if (!Array.isArray(response.json.results)) return callback("No location matches address " + address);

        callback(null, {
            lat: response.json.results[0].geometry.location.lat,
            lng: response.json.results[0].geometry.location.lng
        });
    });
}

module.exports = {
    geocode,
    distance: geodatasource.distance
};
