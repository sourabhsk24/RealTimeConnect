from django.contrib import admin
from .models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "host", "created_at")
    search_fields = ("name", "host__username")
    ordering = ("-created_at",)