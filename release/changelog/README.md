# Release changelog drop folder

Put the release changelog `.txt` file(s) in this folder (`release/changelog/`).

The page at `/releasechangelog` shows and downloads them (GitHub Contents API
first, `manifest.json` as offline fallback).

After adding a file, update `manifest.json` in this folder:

```json
{ "files": ["release-latest.txt"] }
```
