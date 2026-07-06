from pathlib import Path

ignore = {
    ".git",
    ".idea",
    "target",
    "__pycache__",
    ".venv"
}

def tree(path: Path, prefix=""):
    items = [p for p in path.iterdir() if p.name not in ignore]
    items.sort(key=lambda p: (p.is_file(), p.name.lower()))

    for i, item in enumerate(items):
        connector = "└── " if i == len(items) - 1 else "├── "
        print(prefix + connector + item.name)

        if item.is_dir():
            extension = "    " if i == len(items) - 1 else "│   "
            tree(item, prefix + extension)

tree(Path("D:/laptrinh/python/PeopleCounter"))