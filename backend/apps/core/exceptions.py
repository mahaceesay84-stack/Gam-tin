from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """Consistent error body: {"detail": "...", "errors": {...}}."""
    response = exception_handler(exc, context)
    if response is None:
        return None
    data = response.data
    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        return response
    if isinstance(data, list):
        response.data = {"detail": "; ".join(str(i) for i in data), "errors": data}
        return response
    first = ""
    if isinstance(data, dict):
        for key, value in data.items():
            msg = value[0] if isinstance(value, list) and value else value
            first = f"{key}: {msg}" if key != "non_field_errors" else str(msg)
            break
    response.data = {"detail": first or "Invalid request.", "errors": data}
    return response
