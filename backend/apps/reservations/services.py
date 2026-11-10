from datetime import datetime

from django.utils import timezone

from apps.reservations import rules
from apps.reservations.models import Reservation


class ReservationError(Exception):
    pass


def check_in(reservation: Reservation, now: datetime | None = None) -> Reservation:
    now = timezone.localtime(now)

    if reservation.status != Reservation.Status.RESERVED:
        raise ReservationError("Esta reserva não está aguardando check-in.")
    if not rules.is_check_in_allowed(now, reservation.check_in_date):
        raise ReservationError("O check-in só pode ser feito a partir das 14h do dia da reserva.")

    reservation.status = Reservation.Status.CHECKED_IN
    reservation.checked_in_at = now
    reservation.save(update_fields=["status", "checked_in_at"])
    return reservation


def preview_checkout(reservation: Reservation, now: datetime | None = None) -> rules.Bill:
    if reservation.status != Reservation.Status.CHECKED_IN:
        raise ReservationError("Só é possível fazer checkout de um hóspede que está no hotel.")

    return rules.calculate_bill(
        check_in_date=reservation.check_in_date,
        check_out_date=reservation.check_out_date,
        checkout_at=timezone.localtime(now),
        has_car=reservation.has_car,
    )


def check_out(reservation: Reservation, now: datetime | None = None) -> rules.Bill:
    now = timezone.localtime(now)
    bill = preview_checkout(reservation, now)

    reservation.status = Reservation.Status.CHECKED_OUT
    reservation.checked_out_at = now
    reservation.save(update_fields=["status", "checked_out_at"])
    return bill
