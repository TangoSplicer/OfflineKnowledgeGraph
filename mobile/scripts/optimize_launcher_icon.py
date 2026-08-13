from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/upload/1000186368.png")
DESTINATION = Path(__file__).resolve().parents[1] / "assets" / "images"


def write_icon(name: str, size: int) -> None:
    with Image.open(SOURCE) as source:
        image = source.convert("RGBA")
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
        offset = ((size - image.width) // 2, (size - image.height) // 2)
        canvas.alpha_composite(image, offset)
        canvas.save(DESTINATION / name, format="PNG", optimize=True, compress_level=9)


def main() -> None:
    write_icon("icon.png", 512)
    write_icon("splash-icon.png", 512)
    write_icon("android-icon-foreground.png", 512)
    write_icon("favicon.png", 192)


if __name__ == "__main__":
    main()
