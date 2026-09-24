# Agent guide

This is a directly loadable Manifest V3 extension. There is no dependency
install or build step.

- Read [README.md](README.md) for installation, automated tests, and packaging.
- Follow [docs/testing.md](docs/testing.md) for validation before a release or
  a change to copying, shortcuts, setup, or the toast.
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
