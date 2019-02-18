-- 4: Add KYC through real name attestations

ALTER TABLE cp_accounts ADD profile_unit CHAR(44) NULL;
ALTER TABLE cp_accounts ADD first_name VARCHAR NULL;
ALTER TABLE cp_accounts ADD last_name VARCHAR NULL;
ALTER TABLE cp_accounts ADD has_drivers_license INTEGER NOT NULL DEFAULT 0;
