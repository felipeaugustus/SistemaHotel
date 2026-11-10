from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

import pytest

from apps.reservations import services
from apps.reservations.models import Reservation
from apps.reservations.services import ReservationError

pytestmark = pytest.mark.django_db

SAO_PAULO = ZoneInfo("America/Sao_Paulo")
MON = date(2026, 11, 2)
TUE = date(2026, 11, 3)
WED = date(2026, 11, 4)


def at(day: date, hour: int, minute: int = 0) -> datetime:
    return datetime(day.year, day.month, day.day, hour, minute, tzinfo=SAO_PAULO)


@pytest.fixture
def reservation(guest):
    return Reservation.objects.create(
        guest=guest, check_in_date=MON, check_out_date=WED, has_car=True
    )


@pytest.fixture
def checked_in(reservation):
    return services.check_in(reservation, now=at(MON, 15))


class TestCheckIn:
    def test_before_14h_is_refused(self, reservation):
        with pytest.raises(ReservationError):
            services.check_in(reservation, now=at(MON, 13, 59))

        reservation.refresh_from_db()
        assert reservation.status == Reservation.Status.RESERVED

    def test_from_14h_guest_is_checked_in(self, reservation):
        services.check_in(reservation, now=at(MON, 14))

        reservation.refresh_from_db()
        assert reservation.status == Reservation.Status.CHECKED_IN
        assert reservation.checked_in_at == at(MON, 14)

    def test_cannot_check_in_twice(self, checked_in):
        with pytest.raises(ReservationError):
            services.check_in(checked_in, now=at(MON, 16))


class TestCheckOut:
    def test_preview_shows_the_bill_without_finishing_the_stay(self, checked_in):
        bill = services.preview_checkout(checked_in, now=at(WED, 11))

        assert bill.total == Decimal("270.00")
        checked_in.refresh_from_db()
        assert checked_in.status == Reservation.Status.CHECKED_IN

    def test_check_out_finishes_the_stay_and_returns_the_bill(self, checked_in):
        bill = services.check_out(checked_in, now=at(WED, 13))

        assert bill.total == Decimal("330.00")
        checked_in.refresh_from_db()
        assert checked_in.status == Reservation.Status.CHECKED_OUT
        assert checked_in.checked_out_at == at(WED, 13)

    def test_cannot_check_out_without_check_in(self, reservation):
        with pytest.raises(ReservationError):
            services.check_out(reservation, now=at(WED, 11))

    def test_leaving_early_charges_the_whole_reservation(self, checked_in):
        bill = services.check_out(checked_in, now=at(TUE, 10))

        assert bill.total == Decimal("270.00")
