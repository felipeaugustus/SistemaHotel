from django.db import models

from apps.guests.models import Guest


class Reservation(models.Model):
    class Status(models.TextChoices):
        RESERVED = "RESERVED", "Reservada"
        CHECKED_IN = "CHECKED_IN", "Hospedado"
        CHECKED_OUT = "CHECKED_OUT", "Finalizada"

    guest = models.ForeignKey(Guest, on_delete=models.PROTECT, related_name="reservations")
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    has_car = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RESERVED)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["check_in_date"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(check_out_date__gt=models.F("check_in_date")),
                name="check_out_after_check_in",
            ),
        ]

    def __str__(self):
        return f"{self.guest} ({self.check_in_date} a {self.check_out_date})"
