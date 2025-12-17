# Production Reinitialization Runbook

THIS DOCUMENT DESCRIBES A DESTRUCTIVE, LAST-RESORT PROCEDURE. DO NOT RUN THESE STEPS UNLESS YOU ARE AUTHORIZED, HAVE VERIFIED BACKUPS, AND HAVE A TESTED RESTORE PLAN.

Goals
- Provide a reproducible, auditable, and recoverable procedure to reinitialize a production database when absolutely necessary.
- Ensure every destructive action is preceded by backups, approvals, and operational safeguards.

Prerequisites
- Explicit written approval from the release owner or Ops lead.
- Slack/incident channel or ticket created and linked to the operation.
- A verified backup or database snapshot available and its path recorded.
- A tested restore procedure and team available to run a restore if needed.
- Maintenance window scheduled and traffic routed away (maintenance mode).

Required artifacts
- Backup location (example): `s3://company-backups/backery2-app/backup_YYYYMMDD_HHMMSS.sql.gz`
- Allow file on runner: create `/tmp/ALLOW_PROD_REINIT` on the host that will run the script (this ensures an operator performed a manual step on the machine).
- Environment flags: `NODE_ENV=production` and `SKIP_CONFIRM=true` must be explicitly provided.

High-level steps (summary)
1. Verify backup(s) exist and have been validated.
2. Notify stakeholders and put the system into maintenance mode.
3. Ensure no inbound jobs or scheduled tasks will run during the operation.
4. Run the guarded helper `scripts/reinit-db-production.sh` from a trusted runner.
5. Verify the application health and sanity checks after migrations and seed.
6. If anything fails, run the restore plan immediately using the recorded backup.

Detailed Procedure

1) Pre-flight verification

```
# Ensure you're on an ops machine with the allowfile created by an operator
ls -la /tmp/ALLOW_PROD_REINIT

# Verify backup exists (example check for S3)
aws s3 ls s3://company-backups/backery2-app/backup_YYYYMMDD_HHMMSS.sql.gz

# Confirm maintenance mode is enabled (application-specific)
# (Example) call internal API to enable maintenance routing
curl -X POST "https://ops-api.company.local/maintenance/on" -H "Authorization: Bearer $OPS_API_TOKEN"
```

2) Run guarded production reinit (single command)

This helper will refuse to run unless both conditions are met: `SKIP_CONFIRM=true` and `/tmp/ALLOW_PROD_REINIT` exists. It also requires `BACKUP_PATH` to be provided for logging.

```
export NODE_ENV=production
export SKIP_CONFIRM=true
export BACKUP_PATH="s3://company-backups/backery2-app/backup_YYYYMMDD_HHMMSS.sql.gz"
touch /tmp/ALLOW_PROD_REINIT          # operator step - must be present before running
bash scripts/reinit-db-production.sh
```

3) Post-run verification

- Check backend health endpoints (`/health`) and run smoke tests.
- Verify critical data shapes (clients, admin users, role templates) exist as expected.
- Run a set of automated API tests (non-destructive) and verify UI login flows.

Example verification commands

```
curl -fS https://api.production.yourcompany.com/health
cd backend && npm run db:check
cd backend && npm test -- -t "smoke"
```

Rollback / Restore

If anything goes wrong, follow the tested restore path immediately (restore from verified backup):

```
# Example restore (replace with your cloud provider commands)
aws s3 cp ${BACKUP_PATH} - | psql $DATABASE_URL
# Or use provider snapshot restore
```

Audit and Logging

- Save the command run, operator who created `/tmp/ALLOW_PROD_REINIT`, timestamps, backup locations, and approval ticket ID into the incident ticket.
- Keep logs of `scripts/reinit-db-production.sh` output and attach to the incident record.

Notes

- Reinitializing production is normally unnecessary. Prefer migrations that transform data safely and non-destructively.
- Consider restoring a copy of production into a staging environment for destructive testing rather than wiping production.
- If you are unsure, pause and escalate.

Related docs
- [DATABASE_SAFETY.md](./DATABASE_SAFETY.md)
- [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [CODE_GUIDELINES.md](../CODE_GUIDELINES.md)
