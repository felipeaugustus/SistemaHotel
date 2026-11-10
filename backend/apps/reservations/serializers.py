from django.utils import timezone
from rest_framework import serializers

from apps.guests.models import Guest
from apps.guests.serializers import GuestSerializer
from apps.reservations.models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    guest = GuestSerializer(read_only=True)
    guest_id = serializers.PrimaryKeyRelatedField(
        queryset=Guest.objects.all(), source="guest", write_only=True
    )

    class Meta:
        model = Reservation
        fields = [
            "id",
            "guest",
            "guest_id",
            "check_in_date",
            "check_out_date",
            "has_car",
            "status",
            "checked_in_at",
            "checked_out_at",
        ]
        read_only_fields = ["status", "checked_in_at", "checked_out_at"]

    def validate_check_in_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("A data de entrada não pode estar no passado.")
        return value

    def validate(self, data):
        if data["check_out_date"] <= data["check_in_date"]:
            raise serializers.ValidationError(
                {"check_out_date": "A data de saída deve ser posterior à data de entrada."}
            )
        return data


class ChargeSerializer(serializers.Serializer):
    type = serializers.CharField()
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class BillSerializer(serializers.Serializer):
    charges = ChargeSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
