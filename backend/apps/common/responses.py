from rest_framework.response import Response
from rest_framework import status

def api_response(data=None, message="Operation successful.", status_code=status.HTTP_200_OK, errors=None, success=True):
    """
    Standardized API Response wrapper.
    """
    return Response(
        {
            "success": success,
            "message": message,
            "data": data,
            "errors": errors,
        },
        status=status_code
    )
