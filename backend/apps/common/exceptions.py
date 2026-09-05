import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        message = "Validation or client error."
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = str(response.data['detail'])
            elif response.data:
                first_key = list(response.data.keys())[0]
                first_val = response.data[first_key]
                if isinstance(first_val, list) and len(first_val) > 0:
                    message = f"{first_key}: {first_val[0]}"
                else:
                    message = f"{first_key}: {first_val}"

        response.data = {
            "success": False,
            "message": message,
            "data": None,
            "errors": response.data,
        }
        return response

    logger.error("Unhandled Exception: %s", str(exc), exc_info=True)
    return Response(
        {
            "success": False,
            "message": "An unexpected internal server error occurred.",
            "data": None,
            "errors": {"detail": str(exc)},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
