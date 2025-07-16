from django.db import models

# Create your models here.

class Question(models.Model):
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )
    text = models.TextField()
    topic = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    time_required = models.IntegerField(default=60)  # seconds

    def __str__(self):
        return f"{self.topic} - {self.difficulty}: {str(self.text)[:40]}"
