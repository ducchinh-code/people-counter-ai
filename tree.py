from pathlib import Path

IGNORE = {".venv", "__pycache__", ".git"}

def tree(path: Path, prefix=""):
    items = sorted([p for p in path.iterdir() if p.name not in IGNORE])

    for i, item in enumerate(items):
        last = i == len(items) - 1
        print(prefix + ("└── " if last else "├── ") + item.name)

        if item.is_dir():
            tree(item, prefix + ("    " if last else "│   "))

tree(Path("."))