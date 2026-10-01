from django.conf import settings
from django.utils.module_loading import import_string


def get_document_storage():
    """Return the storage backend for uploaded documents.

    Controlled by settings.DOCUMENT_STORAGE_BACKEND so switching to cloud
    storage is a configuration change.
    """
    backend = import_string(settings.DOCUMENT_STORAGE_BACKEND)
    if settings.DOCUMENT_STORAGE_BACKEND.endswith("FileSystemStorage"):
        return backend(location=settings.MEDIA_ROOT)
    return backend()
