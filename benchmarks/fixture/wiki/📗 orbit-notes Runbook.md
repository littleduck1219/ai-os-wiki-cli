# 📗 orbit-notes Runbook

## Deploy

- Deploy by `rsync` of the project directory to the home server `duckbox`.
- The service runs under systemd as the unit `orbit-notes.service`.
- Restart after deploy: `sudo systemctl restart orbit-notes`.

## Logs

- Production logs: `journalctl -u orbit-notes -f` on `duckbox`.

## Run locally

- `npm start` (listens on port 8787 unless `PORT` is set).
