import pytest
from rest_framework.test import APIClient

from apps.accounts.tests.helpers import (
    CLIENT_ID,
    REDIRECT_URI,
    authorize_url,
    code_from,
    make_pkce_pair,
)

pytestmark = pytest.mark.django_db


def authorize(client, challenge, **extra):
    return client.get(authorize_url(challenge, **extra))


def request_token(client, code, verifier):
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "code_verifier": verifier,
    }
    return client.post("/o/token/", data)


def test_api_requires_a_token(db):
    response = APIClient().get("/api/guests/")

    assert response.status_code == 401


def test_password_is_stored_as_argon2_hash(attendant):
    assert attendant.password.startswith("argon2")


def test_anonymous_user_is_sent_to_the_login_page(client, application):
    _, challenge = make_pkce_pair()

    response = authorize(client, challenge)

    assert response.status_code == 302
    assert response["Location"].startswith("/accounts/login/")


def test_authorization_code_with_pkce_gives_access_to_the_api(logged_in_client, application):
    verifier, challenge = make_pkce_pair()

    authorization = authorize(logged_in_client, challenge)
    assert authorization["Location"].startswith(REDIRECT_URI)

    token = request_token(logged_in_client, code_from(authorization), verifier)
    assert token.status_code == 200

    api_client = APIClient()
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.json()['access_token']}")
    assert api_client.get("/api/guests/").status_code == 200


def test_code_is_refused_with_the_wrong_verifier(logged_in_client, application):
    _, challenge = make_pkce_pair()
    other_verifier, _ = make_pkce_pair()

    authorization = authorize(logged_in_client, challenge)
    token = request_token(logged_in_client, code_from(authorization), other_verifier)

    assert token.status_code == 400


def test_prompt_login_asks_for_the_password_again(logged_in_client, application):
    _, challenge = make_pkce_pair()

    response = authorize(logged_in_client, challenge, prompt="login")

    assert response["Location"].startswith("/accounts/login/")
