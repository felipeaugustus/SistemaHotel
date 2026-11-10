from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from enum import StrEnum

WEEKDAY_DAILY_RATE = Decimal("120.00")
WEEKEND_DAILY_RATE = Decimal("180.00")
WEEKDAY_PARKING_RATE = Decimal("15.00")
WEEKEND_PARKING_RATE = Decimal("20.00")
LATE_CHECKOUT_FEE_RATIO = Decimal("0.50")

CHECK_IN_START = time(14, 0)
CHECK_OUT_LIMIT = time(12, 0)

CENTS = Decimal("0.01")


class ChargeType(StrEnum):
    DAILY = "DAILY"
    PARKING = "PARKING"
    LATE_CHECKOUT = "LATE_CHECKOUT"


@dataclass(frozen=True)
class Charge:
    type: ChargeType
    date: date
    amount: Decimal


@dataclass(frozen=True)
class Bill:
    charges: tuple[Charge, ...]

    @property
    def total(self) -> Decimal:
        return sum((charge.amount for charge in self.charges), Decimal("0.00"))


def is_weekend(day: date) -> bool:
    return day.weekday() >= 5


def daily_rate(day: date) -> Decimal:
    return WEEKEND_DAILY_RATE if is_weekend(day) else WEEKDAY_DAILY_RATE


def parking_rate(day: date) -> Decimal:
    return WEEKEND_PARKING_RATE if is_weekend(day) else WEEKDAY_PARKING_RATE


def stay_nights(check_in_date: date, check_out_date: date) -> list[date]:
    if check_out_date <= check_in_date:
        raise ValueError("A data de saída deve ser posterior à data de entrada.")
    nights = (check_out_date - check_in_date).days
    return [check_in_date + timedelta(days=offset) for offset in range(nights)]


def is_check_in_allowed(now: datetime, expected_check_in_date: date) -> bool:
    earliest = datetime.combine(expected_check_in_date, CHECK_IN_START, tzinfo=now.tzinfo)
    return now >= earliest


def is_late_checkout(checkout_at: datetime) -> bool:
    return checkout_at.time().replace(second=0, microsecond=0) > CHECK_OUT_LIMIT


def calculate_bill(
    check_in_date: date, check_out_date: date, checkout_at: datetime, has_car: bool
) -> Bill:
    checkout_day = checkout_at.date()
    last_day = max(check_out_date, checkout_day)
    charges: list[Charge] = []

    for night in stay_nights(check_in_date, last_day):
        charges.append(Charge(ChargeType.DAILY, night, daily_rate(night)))
        if has_car:
            charges.append(Charge(ChargeType.PARKING, night, parking_rate(night)))

    # Quem sai antes da data prevista já pagou a diária daquele dia, então não há multa.
    if checkout_day >= check_out_date and is_late_checkout(checkout_at):
        fee = (daily_rate(checkout_day) * LATE_CHECKOUT_FEE_RATIO).quantize(CENTS)
        charges.append(Charge(ChargeType.LATE_CHECKOUT, checkout_day, fee))

    return Bill(tuple(charges))
