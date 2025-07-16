from django.urls import path
from .views import RegisterView, UserInfoView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserInfoView.as_view(), name='user-info'),
]