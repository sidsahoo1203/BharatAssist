"""Custom exception hierarchy (Unit 2: user-defined exceptions)."""


class BharatAssistError(Exception):
    """Base class for every error raised by this package."""


class DatasetNotFoundError(BharatAssistError):
    """Raised when an expected dataset file is missing."""

    def __init__(self, path):
        self.path = path
        super().__init__(f"Dataset file not found: {path}")


class InvalidRecordError(BharatAssistError):
    """Raised when a record is missing a required field."""


class ModelNotTrainedError(BharatAssistError):
    """Raised when predict/save is called before fit."""

    def __init__(self, model_name):
        super().__init__(f"Model '{model_name}' must be trained before use.")


class EmptyInputError(BharatAssistError):
    """Raised when text to classify is empty after cleaning."""
