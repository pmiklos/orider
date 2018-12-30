INSERT INTO cp_accounts(device, payout_address)
VALUES ('0X7EJ4UUGYR3D2K2ZRLP557TMYOUKUCND', 'N6SOYZHMRFTGDOY52GOYJ6UQ5E3WZBZD'),
       ('0VMPNBGPUWUU2O2TAQUY3VVVK5BQYRV4O', 'MTS77XUDDGMH5YVD7IXUMSIWQG2OQIMW');

INSERT INTO cp_rides (device, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, departure, seats, price_per_seat, checkin_code)
VALUES
    ('0X7EJ4UUGYR3D2K2ZRLP557TMYOUKUCND', '1 1st Avenue, Oakland, CA', 37.7988443, -122.2591694, 'Union Square, San Francisco, CA', 37.787933, -122.4096922, '2019-03-31 09:00:00', 2, 2000, '4135b800-14c5-4b8a-bccf-4a41f96f5173'),
    ('0X7EJ4UUGYR3D2K2ZRLP557TMYOUKUCND', '1 West Market Street, Daly City, CA', 37.6897821,-122.4682192, 'Moscone Center, San Francisco, CA', 37.7843234, -122.402884, '2019-02-20 08:30:00', 3, 2100, '333759be-8575-4d60-aa81-b60c1a3df10a');
