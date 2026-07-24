from slowapi import Limiter
from slowapi.util import get_remote_address

# Global rate limit: 60 requests per minute per IP
# Auth endpoints will override this with their own 5/minute limit
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
