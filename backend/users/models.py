from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('candidate', 'Candidate'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='candidate')
    is_blocked_from_interview = models.BooleanField(default=False)  # type: ignore
    has_completed_interview = models.BooleanField(default=False)  # type: ignore

    def __str__(self):
        return self.username
