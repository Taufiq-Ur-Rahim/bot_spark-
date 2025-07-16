from django.shortcuts import render
from rest_framework import generics, permissions
from .models import User
from .serializers import UserSerializer
from typing import Any

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()  # type: ignore[attr-defined]
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class UserInfoView(generics.RetrieveAPIView):
    queryset = User.objects.all()  # type: ignore[attr-defined]
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user
