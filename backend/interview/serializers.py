from rest_framework import serializers
from .models import InterviewSession, SessionQuestion
from questions.serializers import QuestionSerializer

class SessionQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = SessionQuestion
        fields = ['id', 'question', 'response', 'response_time', 'is_correct']

class InterviewSessionSerializer(serializers.ModelSerializer):
    sessionquestion_set = SessionQuestionSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField()

    class Meta:
        model = InterviewSession
        fields = ['id', 'user', 'start_time', 'end_time', 'score', 'sessionquestion_set'] 