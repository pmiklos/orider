# byteball-carpool
Carpooling for Byteballers

This project is submitted to [The Great Byteball Bot War Use-a-thon](https://wiki.byteball.org/Use-a-thon/botwar).

The main idea is to make the payment for the ride more secure for both the driver and the people sharing the ride.
The payments for the ride are captured in a smart contract that unlocks only if they reach the destination. Since
the fee for the drive is paid in advance, the driver can be sure that a he or she gets paid as long as they drive
to the agreed destination.

This is a simplified version of a ride sharing. The driver posts the pick-up location and destination in advance in a
carpooling bulletin board where people can sign up and join the rides. Once they arrive at the pick-up location, they
scan the QR code displayed on the driver's mobile screen with their Byteball wallet app to check-in for the ride. As
soon as they are ready to leave, the driver closes the check-in period and the smart contract is sent out to the riders who
make the payment. The driver gets notified about the incoming payments and when all have paid, the trip starts. When they
reach the destination and the driver completes the trip, the GPS coordinates are read and transmitted to the
`byteball-carpool` bot which checks if the people taking the ride are all at the destination. If so, it posts a 
completed notification to its oracle data feed which unlocks the smart contract and the funds are releleased to the
driver. In case the trip is completed without reaching the destination, a notification indicating the incomplete trip is
posted and the smart contract releases the funds back to the passengers.

As a plus, real name attestation could be required from all parties to make the ride share safer. In case of an incident
the real identity of the people would be known and handed to the police.
