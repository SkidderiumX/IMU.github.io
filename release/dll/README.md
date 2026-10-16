# Release DLL drop folder

Put the release `.dll` file(s) in this folder (`release/dll/`).

The page at `/release` lists every `.dll` / `.exe` / `.jar` found here (via the
GitHub Contents API, with `manifest.json` as offline fallback) and starts a
download of the first file automatically.

After adding a file, update `manifest.json` in this folder:

```json
{ "files": ["myau_native.dll"] }
```
