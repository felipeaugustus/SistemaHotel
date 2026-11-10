from rest_framework import filters, viewsets

from apps.guests.models import Guest
from apps.guests.serializers import GuestSerializer


class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "document", "phone"]
    http_method_names = ["get", "post", "patch", "head", "options"]
