from django.contrib.auth.models import User
from django.db import models


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    host = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="hosted_rooms"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name