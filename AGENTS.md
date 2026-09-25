# Agent guide

This is a Manifest V3 extension with no dependency install or compilation.
`scripts/build-dev.py` prepares the separately named unpacked development copy;
`scripts/package.sh` creates the Web Store archive.

- Read [README.md](README.md) for installation, automated tests, and packaging.
- Follow [docs/testing.md](docs/testing.md) for validation before a release or
  a change to copying, shortcuts, setup, the toast, or profile moves.
- Keep ProfileBar integration optional. A failed or unavailable native handoff
  must leave the source tab open, and the copy shortcut must still work.
- Use [STORE_LISTING.md](STORE_LISTING.md) for the Web Store listing and
  submission notes. Keep claims there aligned with the code and
  [PRIVACY.md](PRIVACY.md).
- Keep permissions narrow. If a runtime file is added or removed, update the
  explicit file list in [scripts/package.sh](scripts/package.sh).
- The SVGs in `assets/` and PNGs in `icons/` and `store-assets/` are separate
  checked-in files. Check which of them an asset change affects; this repo has
  no single command that regenerates all images.

If available, `simplify` is useful for the final code review. It is optional;
the checks in `docs/testing.md` are the project test procedure.
