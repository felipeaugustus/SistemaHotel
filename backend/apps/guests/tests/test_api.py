import pytest

from apps.guests.models import Guest

pytestmark = pytest.mark.django_db

URL = "/api/guests/"


def test_create_guest(api_client):
    response = api_client.post(
        URL, {"name": "João Souza", "document": "98765432100", "phone": "21988887777"}
    )

    assert response.status_code == 201
    assert Guest.objects.filter(document="98765432100").exists()


def test_document_must_be_unique(api_client, guest):
    response = api_client.post(
        URL, {"name": "Outra Pessoa", "document": guest.document, "phone": "21988887777"}
    )

    assert response.status_code == 400
    assert "document" in response.json()


@pytest.mark.parametrize("term", ["maria", "345678", "99999"])
def test_search_by_name_document_or_phone(api_client, guest, term):
    Guest.objects.create(name="João Souza", document="98765432100", phone="21988887777")

    response = api_client.get(URL, {"search": term})

    assert [g["name"] for g in response.json()] == ["Maria Silva"]
