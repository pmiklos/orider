CREATE TABLE cp_accounts (
    device CHAR(33) NOT NULL PRIMARY KEY,
    profile_unit CHAR(44) NULL,
    first_name VARCHAR NULL,
    last_name VARCHAR NULL,
    has_drivers_license INTEGER NOT NULL DEFAULT 0,
    payout_address CHAR(32) NULL,
    vehicle VARCHAR(255) NULL,
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
    completion_score FLOAT NULL,
    oracle_value VARCHAR NULL, -- INCOMPLETE, COMPLETED
    oracle_unit CHAR(44) NULL,
    FOREIGN KEY (device) REFERENCES cp_accounts(device)
);

CREATE INDEX cp_rides_departure ON cp_rides(departure);
CREATE INDEX cp_rides_device ON cp_rides(device);
CREATE INDEX cp_rides_checkin_code ON cp_rides(checkin_code);
CREATE INDEX cp_rides_status ON cp_rides(status);

CREATE TABLE cp_reservations (
    ride_id INTEGER NOT NULL,
    device CHAR(33) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'reserved', -- reserved, checkedin, completed
    reservation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contract_address CHAR(32) NULL,
    payment_status VARCHAR NOT NULL DEFAULT 'unpaid', -- unpaid, received, paid, failed
    payment_unit CHAR(44) NULL,
    checkin_date DATETIME NULL,
    arrival_date DATETIME NULL,
    arrival_lat FLOAT NULL,
    arrival_lng FLOAT NULL,
    arrival_accuracy FLOAT NULL,
    completion_score FLOAT NULL,
    payout_unit CHAR(44) NULL,
    refund_unit CHAR(44) NULL,
    PRIMARY KEY (ride_id, device),
    FOREIGN KEY (ride_id) REFERENCES cp_rides(ride_id),
    FOREIGN KEY (device) REFERENCES cp_accounts(device)
);

CREATE INDEX cp_reservations_device ON cp_reservations(device);

CREATE VIEW cp_driver_stats AS
SELECT driver_stats.device,
    driver_stats.avg_completion_score avg_driver_score,
    passenger_stats.avg_completion_score avg_passenger_score,
    (driver_stats.total_completion_score + passenger_stats.total_completion_score) / (driver_stats.count_rides + passenger_stats.count_passengers) avg_score,
    driver_stats.count_rides,
    passenger_stats.count_passengers
FROM
    (
        SELECT device,
            AVG(completion_score) avg_completion_score,
            SUM(completion_score) total_completion_score,
            COUNT(1) count_rides
        FROM cp_rides
        WHERE status='completed'
        GROUP BY 1
    ) driver_stats,
    (
        SELECT ride.device,
            AVG(reservation.completion_score) avg_completion_score,
            SUM(reservation.completion_score) total_completion_score,
            COUNT(1) count_passengers
        FROM cp_rides ride
        JOIN cp_reservations reservation USING (ride_id)
        WHERE ride.status='completed'
            AND reservation.status='completed'
        GROUP BY 1
    ) passenger_stats
WHERE driver_stats.device = passenger_stats.device;
