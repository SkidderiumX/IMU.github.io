# IMU-Web

Simple overview site for the InjectMyau client, with beta/release DLL downloads
and changelogs. Hosted free on GitHub Pages.

## Routes

| URL | Source folder | Behaviour |
|-----|---------------|-----------|
| `/` | `index.html` | Overview, download cards, last GitHub release |
| `/beta` | `beta/dll/` | Lists DLLs, auto-downloads the first file |
| `/betachangelog` | `beta/changelog/` | Shows and downloads beta changelog `.txt` files |
| `/release` | `release/dll/` | Lists DLLs, auto-downloads the first file |
| `/releasechangelog` | `release/changelog/` | Shows and downloads release changelog `.txt` files |

## Publishing files

1. Add the `.dll` to `beta/dll/` or `release/dll/` and update the sibling
   `manifest.json` (`{ "files": ["name.ext"] }`) as offline fallback. Online,
   DLL pages also list folder contents via the GitHub Contents API.
2. Add any changelog `.txt` to `beta/changelog/` or `release/changelog/`.
   The file name does not matter. No manifest needed. Commit and push.
   Pages redeploys automatically and the changelog pages pick the file up.

The homepage "Last GitHub release" box reads
`SkidderiumX/InjectMyau-Unarchive` (latest release API) with `releases.json`
as offline fallback.

## Local preview

```powershell
python -m http.server 3000
# then open http://localhost:3000/
```
