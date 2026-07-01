import logging
import sys
from pathlib import Path


def get_logger(name: str) -> logging.Logger:
    """
    Trả về logger đã cấu hình sẵn cho module có tên `name`.
    Ghi đồng thời ra console và file output/app.log.

    Dùng:
        from utils.logger import get_logger
        logger = get_logger(__name__)
        logger.info("Camera started")
    """

    logger = logging.getLogger(name)

    # Tránh thêm handler trùng nếu get_logger được gọi nhiều lần
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # --- Console handler: chỉ in INFO trở lên ---
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # --- File handler: ghi tất cả kể cả DEBUG ---
    Path("output").mkdir(exist_ok=True)
    file_handler = logging.FileHandler("output/app.log", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger