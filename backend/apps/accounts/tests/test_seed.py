import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from oauth2_provider.models import Application

pytestmark = pytest.mark.django_db


def test_seed_creates_attendant_and_frontend_application():
    call_command("seed")

    attendant = get_user_model().objects.get(username="atendente")
    assert attendant.check_password("atendente123")

    application = Application.objects.get(client_id="hotel-frontend")
    assert application.client_type == Application.CLIENT_PUBLIC
    assert application.authorization_grant_type == Application.GRANT_AUTHORIZATION_CODE


def test_seed_can_run_more_than_once():
    call_command("seed")
    call_command("seed")

    assert get_user_model().objects.filter(username="atendente").count() == 1
    assert Application.objects.filter(client_id="hotel-frontend").count() == 1
