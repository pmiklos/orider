#!/bin/bash

DATABASE=$1

if [ "$DATABASE" == "" ]; then
    echo "Usage: backup.sh <database path>" >&2
    exit 1;
fi

DATE="$(date +'%Y%m%d')"
BACKUP_DIR="$(dirname $DATABASE)/backups"

test -d $BACKUP_DIR || mkdir -p $BACKUP_DIR

BACKUP_FILE="$BACKUP_DIR/$DATE.sql.gpg"

echo "Backing up to $BACKUP_FILE"

cat << EOF | sqlite3 $DATABASE | gpg --output "${BACKUP_FILE}" --encrypt --recipient orider@obyte.app
.dump cp_accounts
.dump cp_rides
.dump cp_reservations
.dump private_profiles
.dump private_profile_fields
.dump shared_addresses
.dump shared_address_signing_paths
.dump my_addresses
.dump pairing_secrets
.dump correspondent_devices
.quit
EOF
