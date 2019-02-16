-- 4: Add KYC through real name attestations

ALTER TABLE cp_accounts ADD first_name VARCHAR;
ALTER TABLE cp_accounts ADD last_name VARCHAR;
