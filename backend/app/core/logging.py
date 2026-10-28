import logging
import sys
from app.core.config import settings

def configure_logging():
    log_format = "%(asctime)s | %(levelname)-8s | %(name)-35s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Suppress overly verbose SQLAlchemy/uvicorn logs in production
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    root_logger = logging.getLogger("logimind")
    root_logger.setLevel(logging.DEBUG)

    return root_logger

logger = configure_logging()
