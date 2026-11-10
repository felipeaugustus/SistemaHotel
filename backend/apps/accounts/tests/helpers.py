import base64
import hashlib
import secrets
from urllib.parse import parse_qs, urlencode, urlparse

CLIENT_ID = "test-frontend"
REDIRECT_URI = "http://localhost:5173/callback"


def make_pkce_pair():
    verifier = secrets.token_urlsafe(48)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


def authorize_url(challenge, **extra):
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        **extra,
    }
    return f"/o/authorize/?{urlencode(params)}"


def code_from(response):
    return parse_qs(urlparse(response["Location"]).query)["code"][0]
