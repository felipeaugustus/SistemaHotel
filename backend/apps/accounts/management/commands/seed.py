import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from oauth2_provider.models import Application


class Command(BaseCommand):
    help = "Cria o usuário atendente e a aplicação OAuth do frontend."

    def handle(self, *args, **options):
        self.create_attendant()
        self.create_frontend_application()

    def create_attendant(self):
        username = os.environ.get("ATTENDANT_USERNAME", "atendente")
        password = os.environ.get("ATTENDANT_PASSWORD", "atendente123")

        user, created = get_user_model().objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f"Usuário '{username}' criado.")

    def create_frontend_application(self):
        client_id = os.environ.get("OAUTH_CLIENT_ID", "hotel-frontend")
        redirect_uris = os.environ.get(
            "OAUTH_REDIRECT_URIS",
            "http://localhost:5173/callback http://localhost:8080/callback",
        )

        Application.objects.update_or_create(
            client_id=client_id,
            defaults={
                "name": "Frontend do hotel",
                "client_type": Application.CLIENT_PUBLIC,
                "authorization_grant_type": Application.GRANT_AUTHORIZATION_CODE,
                "redirect_uris": redirect_uris,
                "skip_authorization": True,
            },
        )
        self.stdout.write(f"Aplicação OAuth '{client_id}' configurada.")
