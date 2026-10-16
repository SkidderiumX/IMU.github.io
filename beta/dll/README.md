# Beta DLL drop folder

Put the beta `.dll` file(s) in this folder (`beta/dll/`).

The page at `/beta` lists every `.dll` / `.exe` / `.jar` found here (via the
GitHub Contents API, with `manifest.json` as offline fallback) and starts a
download of the first file automatically.

After adding a file, update `manifest.json` in this folder:

```json
{ "files": ["myau_native_beta.dll"] }
```
