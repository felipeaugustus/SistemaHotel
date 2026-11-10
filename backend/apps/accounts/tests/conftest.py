import pytest
from oauth2_provider.models import Application

from apps.accounts.tests.helpers import CLIENT_ID, REDIRECT_URI


@pytest.fixture
def application(db):
    return Application.objects.create(
        client_id=CLIENT_ID,
        client_type=Application.CLIENT_PUBLIC,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris=REDIRECT_URI,
        skip_authorization=True,
    )


@pytest.fixture
def logged_in_client(client, attendant):
    client.force_login(attendant)
    return client
