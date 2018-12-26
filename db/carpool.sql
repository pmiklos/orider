CREATE TABLE cp_rides (
    ride_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    device CHAR(33) NOT NULL,
    pickup_address VARCHAR NOT NULL,
    pickup_lat FLOAT NOT NULL,
    pickup_lng FLOAT NOT NULL,
    dropoff_address VARCHAR NOT NULL,
    dropoff_lat FLOAT NOT NULL,
    dropoff_lng FLOAT NOT NULL,
    departure DATETIME NOT NULL,
    seats TINYINT NOT NULL,
    price_per_seat INTEGER NOT NULL
);

CREATE INDEX cp_rides_departure ON cp_rides(departure);
