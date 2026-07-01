import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

MAX_LOG_BYTES = 10 * 1024 * 1024
BACKUP_COUNT = 5


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    Path("output/logs").mkdir(parents=True, exist_ok=True)
    safe_name = name.replace(".", "_").replace("/", "_")
    file_handler = RotatingFileHandler(
        f"output/logs/{safe_name}.log",
        maxBytes=MAX_LOG_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger