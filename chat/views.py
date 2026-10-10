from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404, redirect, render

from .models import Room


def register(request):
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        if not username or not password:
            return render(
                request,
                "chat/register.html",
                {"error": "Username and password are required."},
            )

        if password != confirm_password:
            return render(
                request,
                "chat/register.html",
                {"error": "Passwords do not match."},
            )

        if User.objects.filter(username=username).exists():
            return render(
                request,
                "chat/register.html",
                {"error": "Username already exists."},
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        login(request, user)
        return redirect("home")

    return render(request, "chat/register.html")


def user_login(request):
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        user = authenticate(
            request,
            username=username,
            password=password,
        )

        if user is not None:
            login(request, user)
            return redirect("home")

        return render(
            request,
            "chat/login.html",
            {"error": "Invalid username or password."},
        )

    return render(request, "chat/login.html")


def user_logout(request):
    logout(request)
    return redirect("login")


@login_required
def home(request):
    rooms = Room.objects.select_related("host").order_by("-created_at")
    return render(request, "chat/home.html", {"rooms": rooms})


@login_required
def create_room(request):
    if request.method == "POST":
        room_name = request.POST.get("room_name", "").strip()

        if room_name:
            room = Room.objects.create(
                name=room_name,
                host=request.user,
            )
            return redirect("room", room_name=room.name)

    return redirect("home")


@login_required
def room(request, room_name):
    meeting_room = get_object_or_404(Room, name=room_name)
    return render(request, "chat/room.html", {"room": meeting_room})


