# Beta changelog drop folder

Put the beta changelog `.txt` file(s) in this folder (`beta/changelog/`).

The page at `/betachangelog` shows and downloads them (GitHub Contents API
first, `manifest.json` as offline fallback).

After adding a file, update `manifest.json` in this folder:

```json
{ "files": ["beta-latest.txt"] }
```
