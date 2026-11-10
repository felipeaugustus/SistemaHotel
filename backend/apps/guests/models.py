from django.db import models


class Guest(models.Model):
    name = models.CharField("nome", max_length=150)
    document = models.CharField("documento", max_length=30, unique=True)
    phone = models.CharField("telefone", max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "hóspede"
        ordering = ["name"]

    def __str__(self):
        return self.name
