from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.reservations.models import Reservation

pytestmark = pytest.mark.django_db

URL = "/api/reservations/"


def days_from_today(days: int):
    return timezone.localdate() + timedelta(days=days)


def create_reservation(guest, **fields):
    defaults = {"check_in_date": days_from_today(0), "check_out_date": days_from_today(2)}
    return Reservation.objects.create(guest=guest, **{**defaults, **fields})


class TestCreate:
    def test_create_reservation(self, api_client, guest):
        response = api_client.post(
            URL,
            {
                "guest_id": guest.id,
                "check_in_date": days_from_today(1),
                "check_out_date": days_from_today(3),
                "has_car": True,
            },
        )

        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "RESERVED"
        assert body["guest"]["name"] == guest.name

    def test_check_out_date_must_be_after_check_in_date(self, api_client, guest):
        response = api_client.post(
            URL,
            {
                "guest_id": guest.id,
                "check_in_date": days_from_today(3),
                "check_out_date": days_from_today(3),
            },
        )

        assert response.status_code == 400
        assert "check_out_date" in response.json()

    def test_check_in_date_cannot_be_in_the_past(self, api_client, guest):
        response = api_client.post(
            URL,
            {
                "guest_id": guest.id,
                "check_in_date": days_from_today(-1),
                "check_out_date": days_from_today(2),
            },
        )

        assert response.status_code == 400
        assert "check_in_date" in response.json()


class TestList:
    @pytest.fixture
    def reservations(self, guest):
        return {
            status: create_reservation(guest, status=status) for status in Reservation.Status
        }

    @pytest.mark.parametrize(
        "status", [Reservation.Status.RESERVED, Reservation.Status.CHECKED_IN]
    )
    def test_filter_by_status(self, api_client, reservations, status):
        response = api_client.get(URL, {"status": status})

        assert [r["id"] for r in response.json()] == [reservations[status].id]

    def test_search_by_guest(self, api_client, guest):
        reservation = create_reservation(guest)

        found = api_client.get(URL, {"search": "maria"}).json()
        not_found = api_client.get(URL, {"search": "ninguém"}).json()

        assert [r["id"] for r in found] == [reservation.id]
        assert not_found == []

    def test_check_in_today_lists_only_pending_arrivals_of_today(self, api_client, guest):
        arriving_today = create_reservation(guest, check_in_date=days_from_today(0))
        create_reservation(guest, check_in_date=days_from_today(1), check_out_date=days_from_today(3))
        create_reservation(
            guest, check_in_date=days_from_today(0), status=Reservation.Status.CHECKED_IN
        )

        response = api_client.get(URL, {"check_in": "today"})

        assert [r["id"] for r in response.json()] == [arriving_today.id]


class TestCheckIn:
    def test_before_the_reservation_day_returns_conflict(self, api_client, guest):
        reservation = create_reservation(
            guest, check_in_date=days_from_today(1), check_out_date=days_from_today(3)
        )

        response = api_client.post(f"{URL}{reservation.id}/check-in/")

        assert response.status_code == 409
        assert "14h" in response.json()["detail"]

    def test_after_the_reservation_day_checks_in(self, api_client, guest):
        reservation = create_reservation(guest, check_in_date=days_from_today(-1))

        response = api_client.post(f"{URL}{reservation.id}/check-in/")

        assert response.status_code == 200
        assert response.json()["status"] == "CHECKED_IN"


class TestCheckOut:
    @pytest.fixture
    def checked_in(self, guest):
        return create_reservation(
            guest,
            check_in_date=days_from_today(-2),
            status=Reservation.Status.CHECKED_IN,
            checked_in_at=timezone.now() - timedelta(days=2),
        )

    def test_preview_returns_the_detailed_bill(self, api_client, checked_in):
        response = api_client.get(f"{URL}{checked_in.id}/checkout-preview/")

        assert response.status_code == 200
        bill = response.json()
        assert bill["charges"][0]["type"] == "DAILY"
        assert bill["charges"][0]["date"] == str(days_from_today(-2))
        assert Decimal(bill["total"]) == sum(Decimal(c["amount"]) for c in bill["charges"])

    def test_check_out_finishes_the_stay(self, api_client, checked_in):
        response = api_client.post(f"{URL}{checked_in.id}/check-out/")

        assert response.status_code == 200
        assert "total" in response.json()
        checked_in.refresh_from_db()
        assert checked_in.status == Reservation.Status.CHECKED_OUT

    def test_guest_not_in_the_hotel_returns_conflict(self, api_client, guest):
        reservation = create_reservation(guest)

        response = api_client.post(f"{URL}{reservation.id}/check-out/")

        assert response.status_code == 409
