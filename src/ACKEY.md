# ACKEY.md — InjectMyau Pre-posting Invite Keys

> Local key vault for the IMU-Web pre-posting channel.
> This file is a portable backup. The site also keeps keys in `localStorage`.
> Do NOT commit real private keys to a public repo.

## Format

```
IMU_AC_<RL|B>_<alphanum 12..32>
```

- `RL` = release channel (sees all DLLs, can stage)
- `B` = beta channel (sees beta DLLs, can stage)
- Example: `IMU_AC_RL_aaabbbccc111222333`
- Preview (view-only, no staging): `IMU_AC_RL_PREVIEWKEYAC1`

## Saved keys

| Label | Code | Channel | SavedAt |
|-------|------|---------|---------|
| preview | `IMU_AC_RL_PREVIEWKEYAC1` | release (preview) | — |
| allow-1 | `IMU_AC_RL_wf9rGuc9zZgv07VnSB` | release | 2026-10-13 |
| allow-2 | `IMU_AC_RL_7HIh9Nu8LY1Sgy10BZ` | release | 2026-10-13 |
| allow-3 | `IMU_AC_B_KMUF8lFynrK50DlFPu` | beta | 2026-10-13 |
| allow-4 | `IMU_AC_B_pfE9nG1QbUU07zanWE` | beta | 2026-10-13 |

## How to load

1. Open site `#pre-channel` → Saved keys → Load ACKEY.md → pick this file.
2. Or paste a code into the invite box → Unlock → Save current key.
3. Export ACKEY.md button downloads an updated copy of this file.

## Notes

- Static site = client-side gate only (obfuscation). Use a backend for real access control.
- Keys in `localStorage`: `imu_invite` (active), `imu_saved_keys` (vault).
