from slowapi import Limiter
from slowapi.util import get_remote_address

# Dedicated module to avoid circular imports between dependencies and routers
limiter = Limiter(key_func=get_remote_address)
