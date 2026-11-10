import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.guests.models import Guest


@pytest.fixture
def attendant(db):
    return get_user_model().objects.create_user(username="atendente", password="senha-de-teste-123")


@pytest.fixture
def api_client(attendant):
    client = APIClient()
    client.force_authenticate(attendant)
    return client


@pytest.fixture
def guest(db):
    return Guest.objects.create(name="Maria Silva", document="12345678900", phone="11999990000")
