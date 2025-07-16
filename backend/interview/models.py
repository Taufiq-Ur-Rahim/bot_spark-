from django.db import models
from django.conf import settings
from questions.models import Question

# Create your models here.

class InterviewSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.pk} - {self.user}"

class SessionQuestion(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    response = models.TextField(null=True, blank=True)
    response_time = models.IntegerField(null=True, blank=True)  # seconds
    is_correct = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"{self.session} - {self.question}"
