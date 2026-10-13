import logging
import json
import sys
from contextvars import ContextVar
from typing import Optional
from datetime import datetime

# Context variable to hold the Correlation ID for the current request context
correlation_id_ctx: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)

def get_correlation_id() -> str:
    """Retrieve the current correlation ID or default to 'N/A'"""
    return correlation_id_ctx.get() or "N/A"

def set_correlation_id(correlation_id: str) -> None:
    """Set the correlation ID for the active async request context"""
    correlation_id_ctx.set(correlation_id)

class CorrelationIdFilter(logging.Filter):
    """Logging filter to inject correlation_id into log records"""
    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = get_correlation_id()
        return True

class JsonFormatter(logging.Formatter):
    """Structured JSON formatter for production log aggregators"""
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "correlation_id": getattr(record, "correlation_id", "N/A"),
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

class ColoredConsoleFormatter(logging.Formatter):
    """High-contrast ANSI colored console formatter for local development"""
    GREY = "\x1b[38;20m"
    CYAN = "\x1b[36;20m"
    YELLOW = "\x1b[33;20m"
    RED = "\x1b[31;20m"
    BOLD_RED = "\x1b[31;1m"
    RESET = "\x1b[0m"

    LEVEL_COLORS = {
        logging.DEBUG: GREY,
        logging.INFO: CYAN,
        logging.WARNING: YELLOW,
        logging.ERROR: RED,
        logging.CRITICAL: BOLD_RED,
    }

    def format(self, record: logging.LogRecord) -> str:
        color = self.LEVEL_COLORS.get(record.levelno, self.RESET)
        corr_id = getattr(record, "correlation_id", "N/A")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = f"{timestamp} [{color}{record.levelname:<7}{self.RESET}] [corr:{corr_id}] [{record.name}]:"
        message = record.getMessage()
        formatted = f"{prefix} {message}"
        if record.exc_info:
            formatted += f"\n{self.formatException(record.exc_info)}"
        return formatted

def setup_logging(log_level: str = "INFO", log_format: str = "colored") -> logging.Logger:
    """Initialize and configure root and application loggers"""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.addFilter(CorrelationIdFilter())

    if log_format.lower() == "json":
        console_handler.setFormatter(JsonFormatter())
    else:
        console_handler.setFormatter(ColoredConsoleFormatter())

    root_logger.addHandler(console_handler)

    # Return specialized logger for the application
    app_logger = logging.getLogger("ironclad")
    app_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    return app_logger

logger = setup_logging()
