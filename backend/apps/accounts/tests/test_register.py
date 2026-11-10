import pytest
from django.contrib.auth import get_user_model
from oauth2_provider.models import Grant

from apps.accounts.tests.helpers import authorize_url, code_from, make_pkce_pair

pytestmark = pytest.mark.django_db

URL = "/accounts/register/"
PASSWORD = "Senha-Forte-2026"


def register(client, password1=PASSWORD, password2=PASSWORD, next_url=""):
    data = {
        "username": "novo.atendente",
        "password1": password1,
        "password2": password2,
        "next": next_url,
    }
    return client.post(URL, data)


def test_register_page_renders(client):
    response = client.get(URL)

    assert response.status_code == 200
    assert "Criar conta" in response.content.decode()


def test_password_is_stored_as_argon2_hash(client):
    register(client)

    user = get_user_model().objects.get(username="novo.atendente")
    assert user.password.startswith("argon2")


@pytest.mark.parametrize(
    ("password1", "password2"),
    [("12345678", "12345678"), (PASSWORD, "Outra-Senha-2026")],
    ids=["senha-fraca", "senhas-diferentes"],
)
def test_invalid_passwords_are_refused(client, password1, password2):
    response = register(client, password1=password1, password2=password2)

    assert response.status_code == 200
    assert not get_user_model().objects.filter(username="novo.atendente").exists()


def test_new_user_continues_the_authorization_flow(client, application):
    _, challenge = make_pkce_pair()
    next_url = authorize_url(challenge)

    response = register(client, next_url=next_url)
    assert response["Location"] == next_url

    code = code_from(client.get(next_url))
    assert Grant.objects.get(code=code).user.username == "novo.atendente"


def test_registration_replaces_a_previous_session(client, attendant, application):
    client.force_login(attendant)
    _, challenge = make_pkce_pair()
    next_url = authorize_url(challenge)

    register(client, next_url=next_url)

    code = code_from(client.get(next_url))
    assert Grant.objects.get(code=code).user.username == "novo.atendente"


def test_external_next_is_ignored(client):
    response = register(client, next_url="https://site-externo.example/")

    assert response["Location"] == "/"
