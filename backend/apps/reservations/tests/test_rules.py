from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

import pytest

from apps.reservations.rules import (
    Charge,
    ChargeType,
    calculate_bill,
    daily_rate,
    is_check_in_allowed,
    is_late_checkout,
    parking_rate,
    stay_nights,
)

# Semana de referência: 2 a 8 de novembro de 2026 (segunda a domingo).
PREV_SUN = date(2026, 11, 1)
MON = date(2026, 11, 2)
TUE = date(2026, 11, 3)
WED = date(2026, 11, 4)
THU = date(2026, 11, 5)
FRI = date(2026, 11, 6)
SAT = date(2026, 11, 7)
SUN = date(2026, 11, 8)
NEXT_MON = date(2026, 11, 9)


def at(day: date, hour: int, minute: int = 0, second: int = 0) -> datetime:
    return datetime(day.year, day.month, day.day, hour, minute, second)


def test_reference_week_starts_on_monday():
    assert MON.weekday() == 0
    assert SUN.weekday() == 6


class TestRates:
    @pytest.mark.parametrize("day", [MON, TUE, WED, THU, FRI])
    def test_weekdays(self, day):
        assert daily_rate(day) == Decimal("120.00")
        assert parking_rate(day) == Decimal("15.00")

    @pytest.mark.parametrize("day", [SAT, SUN])
    def test_weekend(self, day):
        assert daily_rate(day) == Decimal("180.00")
        assert parking_rate(day) == Decimal("20.00")


class TestStayNights:
    def test_one_night(self):
        assert stay_nights(MON, TUE) == [MON]

    def test_each_night_is_dated_by_the_day_it_starts(self):
        assert stay_nights(FRI, NEXT_MON) == [FRI, SAT, SUN]

    @pytest.mark.parametrize("check_out_date", [MON, PREV_SUN])
    def test_check_out_must_be_after_check_in(self, check_out_date):
        with pytest.raises(ValueError):
            stay_nights(MON, check_out_date)


class TestCheckInTime:
    @pytest.mark.parametrize(
        ("now", "allowed"),
        [
            (at(MON, 13, 59, 59), False),
            (at(MON, 14, 0), True),
            (at(MON, 20, 0), True),
            (at(PREV_SUN, 15, 0), False),  # dia anterior ao previsto
            (at(WED, 9, 0), True),  # chegou com atraso
        ],
    )
    def test_check_in_starts_at_14h_of_expected_date(self, now, allowed):
        assert is_check_in_allowed(now, expected_check_in_date=MON) is allowed

    def test_works_with_timezone_aware_datetimes(self):
        sao_paulo = ZoneInfo("America/Sao_Paulo")
        assert not is_check_in_allowed(at(MON, 13, 0).replace(tzinfo=sao_paulo), MON)
        assert is_check_in_allowed(at(MON, 14, 0).replace(tzinfo=sao_paulo), MON)


class TestLateCheckout:
    @pytest.mark.parametrize(
        ("checkout_at", "late"),
        [
            (at(TUE, 11, 59), False),
            (at(TUE, 12, 0), False),
            (at(TUE, 12, 0, 59), False),
            (at(TUE, 12, 1), True),
            (at(TUE, 18, 0), True),
        ],
    )
    def test_checkout_deadline_is_12h(self, checkout_at, late):
        assert is_late_checkout(checkout_at) is late


class TestCalculateBill:
    def test_weekday_night_without_car(self):
        bill = calculate_bill(MON, TUE, at(TUE, 10, 0), has_car=False)
        assert bill.charges == (Charge(ChargeType.DAILY, MON, Decimal("120.00")),)
        assert bill.total == Decimal("120.00")

    def test_weekend_night_with_car(self):
        bill = calculate_bill(SAT, SUN, at(SUN, 10, 0), has_car=True)
        assert bill.total == Decimal("200.00")

    def test_weekend_with_car_and_late_checkout(self):
        bill = calculate_bill(FRI, NEXT_MON, at(NEXT_MON, 13, 30), has_car=True)

        assert bill.charges == (
            Charge(ChargeType.DAILY, FRI, Decimal("120.00")),
            Charge(ChargeType.PARKING, FRI, Decimal("15.00")),
            Charge(ChargeType.DAILY, SAT, Decimal("180.00")),
            Charge(ChargeType.PARKING, SAT, Decimal("20.00")),
            Charge(ChargeType.DAILY, SUN, Decimal("180.00")),
            Charge(ChargeType.PARKING, SUN, Decimal("20.00")),
            Charge(ChargeType.LATE_CHECKOUT, NEXT_MON, Decimal("60.00")),
        )
        assert bill.total == Decimal("595.00")

    def test_late_fee_uses_the_rate_of_the_checkout_day(self):
        bill = calculate_bill(SAT, SUN, at(SUN, 13, 0), has_car=False)
        assert bill.charges[-1] == Charge(ChargeType.LATE_CHECKOUT, SUN, Decimal("90.00"))
        assert bill.total == Decimal("270.00")

    def test_late_fee_does_not_include_parking(self):
        bill = calculate_bill(MON, TUE, at(TUE, 13, 0), has_car=True)
        assert bill.total == Decimal("195.00")  # 120 + 15 + 60

    def test_checkout_on_time_has_no_late_fee(self):
        bill = calculate_bill(MON, TUE, at(TUE, 12, 0), has_car=False)
        assert ChargeType.LATE_CHECKOUT not in {charge.type for charge in bill.charges}

    def test_leaving_early_still_charges_the_whole_reservation(self):
        bill = calculate_bill(MON, THU, at(TUE, 10, 0), has_car=False)
        assert [charge.date for charge in bill.charges] == [MON, TUE, WED]
        assert bill.total == Decimal("360.00")

    def test_leaving_early_after_12h_has_no_late_fee(self):
        bill = calculate_bill(MON, THU, at(TUE, 15, 0), has_car=False)
        assert ChargeType.LATE_CHECKOUT not in {charge.type for charge in bill.charges}

    def test_leaving_on_the_check_in_day_charges_the_whole_reservation(self):
        bill = calculate_bill(MON, WED, at(MON, 18, 0), has_car=False)
        assert bill.total == Decimal("240.00")

    def test_staying_longer_charges_the_extra_nights(self):
        bill = calculate_bill(MON, TUE, at(WED, 10, 0), has_car=False)
        assert [charge.date for charge in bill.charges] == [MON, TUE]

    def test_staying_longer_and_leaving_after_12h_adds_the_late_fee(self):
        bill = calculate_bill(MON, TUE, at(WED, 13, 0), has_car=False)
        assert bill.total == Decimal("300.00")  # 120 + 120 + 60
