from pathlib import Path

from PIL import Image


PROJECT = Path("/home/ubuntu/offline-knowledge-graph-mobile")
SOURCE = Path("/home/ubuntu/webdev-static-assets/offline-knowledge-graph-local-icon.png")
TARGETS = {
    "assets/images/icon.png": 1024,
    "assets/images/splash-icon.png": 1024,
    "assets/images/android-icon-foreground.png": 1024,
    "assets/images/favicon.png": 512,
}


def main() -> None:
    with Image.open(SOURCE) as source:
        image = source.convert("RGBA")
        for relative_path, dimension in TARGETS.items():
            target = PROJECT / relative_path
            scaled = image.resize((dimension, dimension), Image.Resampling.LANCZOS)
            scaled.save(target, format="PNG", optimize=True, compress_level=9)
            print(f"{target}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
