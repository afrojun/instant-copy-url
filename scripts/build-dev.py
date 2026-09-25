#!/usr/bin/env python3
"""Build a stable, separately named unpacked extension for local testing."""

import json
import subprocess
from pathlib import Path
from zipfile import ZipFile


root = Path(__file__).resolve().parent.parent
source_manifest = json.loads((root / "manifest.json").read_text())
archive = root / "dist" / f"instant-copy-url-{source_manifest['version']}.zip"
dev_directory = root / "dist" / "instant-copy-url-dev"

subprocess.run([root / "scripts" / "package.sh"], check=True, capture_output=True)
dev_directory.mkdir(parents=True, exist_ok=True)
with ZipFile(archive) as package:
    package.extractall(dev_directory)

dev_manifest = json.loads((dev_directory / "manifest.json").read_text())
dev_manifest["name"] = "Instant Copy URL Dev"
dev_manifest["commands"]["copy-current-url"].pop("suggested_key", None)
(dev_directory / "manifest.json").write_text(json.dumps(dev_manifest, indent=2) + "\n")

print(dev_directory)
