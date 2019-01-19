# byteball-carpool
Carpooling for Obyte

This project is submitted to [The Great Byteball Bot War Use-a-thon](https://wiki.byteball.org/Use-a-thon/botwar).

The main idea is to make the payment for the ride more secure for both the driver and the people sharing the ride.
The payments for the ride are captured in a smart contract that unlocks only if they reach the destination. Since
the fee for the drive is paid in advance, the driver can be sure that a he or she gets paid as long as they drive
to the agreed destination.

This is a simplified version of a ride sharing. The driver posts the pick-up location and destination in advance in a
carpooling bulletin board where people can sign up and join the rides. Once they arrive at the pick-up location, they
scan the QR code displayed on the driver's mobile screen with their Obyte wallet app to check-in for the ride. As
soon as they are ready to leave, the driver closes the check-in period and the smart contract is sent out to the riders who
make the payment. The driver gets notified about the incoming payments and when all have paid, the trip starts. When they
reach the destination and the driver completes the trip, the GPS coordinates are read and transmitted to the
`byteball-carpool` bot which checks if the people taking the ride are all at the destination. If so, it posts a 
completed notification to its oracle data feed which unlocks the smart contract and the funds are released to the
driver. In case the trip is completed without reaching the destination, a notification indicating the incomplete trip is
posted and the smart contract releases the funds back to the passengers.

As a plus, real name attestation could be required from all parties to make the ride share safer. In case of an incident
the real identity of the people would be known and handed to the police.

## Installing

Setting up the basic infrastructure on a bare Ubuntu 18 VPS (eg. [DigitalOcean](https://m.do.co/c/7adeb4d35924)):

    # Install some essential packages
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs build-essential nginx
    
    # Installing letsencrypt for HTTPS support:
    sudo apt-get install software-properties-common
    sudo add-apt-repository universe
    sudo add-apt-repository ppa:certbot/certbot
    sudo apt-get update
    sudo apt-get install python-certbot-nginx

Install the Carpooling application:

    # Clone the repo and install and run the app
    git clone https://github.com/pmiklos/byteball-carpool.git
    cd byteball-carpool
    npm install
    node carpool.js
    
Copy the provided nginx script (see etc/nginx.conf), change your domain name at `server_name`.

    sudo cp etc/nginx.conf /etc/nginx/sites-available/carpool-test
    sudo ln -s /etc/nginx/sites-available/carpool-test /etc/nginx/sites-enabled/
    sudo nginx -s reload

Install the SSL certificates:

    sudo certbot --nginx

## Configuration

The app uses [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding/start) to translate addresses to geo locations.
The API requires an API KEY you can set in the `~/.config/byteball-carpool/conf.json`:

    {
        "googleMapsApiKey": "YOUR GOOGLE MAP API KEY"
    }

By default the `access_token` that carries the data for the authenticated wallet is set as a secure cookie. On localhost development you might not have HTTPS set up. To turn secure cookie off set the `supportsHttps` to `false`:

    {
        "supportsHttps": false
    }

## Manual testing

Testing the app is very easy using docker. You can launch as many test wallets as you want to simulate a real life situation.
Since carpools involve one driver and at least one passenger, premade scripts are available to launch a separate wallet for each.

    # Start the driver wallet
    npm run driver-wallet

    # Start the passenger wallet
    npm run passenger-wallet

Both commands require to have docker installed on your linux machine. See detials in [bin/docker-wallet.sh](./bin/docker-wallet.sh)

After launching the wallets use the [testnet faucet](https://obyte.org/testnet.html) to get some test bytes by pairing your wallet with the faucet bot using the pairing code below.

    AxBxXDnPOzE/AxLHmidAjwLPFtQ6dK3k70zM0yKVeDzC@obyte.org/bb-test#0000
