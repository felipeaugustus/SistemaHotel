from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import RegisterView
from apps.guests.views import GuestViewSet
from apps.reservations.views import ReservationViewSet

router = DefaultRouter()
router.register("guests", GuestViewSet, basename="guest")
router.register("reservations", ReservationViewSet, basename="reservation")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/login/", auth_views.LoginView.as_view(), name="login"),
    path("accounts/register/", RegisterView.as_view(), name="register"),
    path("o/", include("oauth2_provider.urls", namespace="oauth2_provider")),
    path("api/", include(router.urls)),
]
