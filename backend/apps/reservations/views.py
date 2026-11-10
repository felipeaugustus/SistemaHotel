from django.utils import timezone
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reservations import services
from apps.reservations.models import Reservation
from apps.reservations.serializers import BillSerializer, ReservationSerializer


class ReservationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ReservationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["guest__name", "guest__document", "guest__phone"]

    def get_queryset(self):
        queryset = Reservation.objects.select_related("guest")
        params = self.request.query_params

        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("check_in") == "today":
            queryset = queryset.filter(
                status=Reservation.Status.RESERVED, check_in_date=timezone.localdate()
            )
        return queryset

    def handle_exception(self, exc):
        if isinstance(exc, services.ReservationError):
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return super().handle_exception(exc)

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        reservation = services.check_in(self.get_object())
        return Response(self.get_serializer(reservation).data)

    @action(detail=True, methods=["get"], url_path="checkout-preview")
    def checkout_preview(self, request, pk=None):
        bill = services.preview_checkout(self.get_object())
        return Response(BillSerializer(bill).data)

    @action(detail=True, methods=["post"], url_path="check-out")
    def check_out(self, request, pk=None):
        bill = services.check_out(self.get_object())
        return Response(BillSerializer(bill).data)
