CREATE TABLE cp_accounts (
    device CHAR(33) NOT NULL PRIMARY KEY,
    payout_address CHAR(32) NULL
--    FOREIGN KEY (device) REFERENCES correspondent_addresses(device_address)
);

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
    price_per_seat INTEGER NOT NULL,
    checkin_code VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'created', -- created, boarding, completed
    arrival_date DATETIME NULL,
    arrival_lat FLOAT NULL,
    arrival_lng FLOAT NULL,
    arrival_accuracy FLOAT NULL,
    FOREIGN KEY (device) REFERENCES cp_accounts(device)
);

CREATE INDEX cp_rides_departure ON cp_rides(departure);
CREATE INDEX cp_rides_device ON cp_rides(device);
CREATE INDEX cp_rides_checkin_code ON cp_rides(checkin_code);
CREATE INDEX cp_rides_status ON cp_rides(status);

CREATE TABLE cp_reservations (
    ride_id INTEGER NOT NULL,
    device CHAR(33) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'reserved', -- reserved, checkedin, checkedout
    reservation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contract_address CHAR(32) NULL,
    checkin_date DATETIME NULL,
    arrival_date DATETIME NULL,
    arrival_lat FLOAT NULL,
    arrival_lng FLOAT NULL,
    arrival_accuracy FLOAT NULL,
    PRIMARY KEY (ride_id, device),
    FOREIGN KEY (ride_id) REFERENCES cp_rides(ride_id),
    FOREIGN KEY (device) REFERENCES cp_accounts(device)
);

CREATE INDEX cp_reservations_device ON cp_reservations(device);