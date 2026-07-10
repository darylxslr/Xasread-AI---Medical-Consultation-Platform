import httpx


_client: httpx.AsyncClient | None = None


def get_http_client(timeout: float = 15.0) -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=timeout)
    return _client

