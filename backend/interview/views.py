from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import InterviewSession, SessionQuestion
from .serializers import InterviewSessionSerializer, SessionQuestionSerializer
from questions.models import Question
from questions.serializers import QuestionSerializer
from django.utils import timezone
import random
from rest_framework.decorators import api_view, permission_classes
from users.models import User
from django.db import models
from typing import List, Dict, Any

# Create your views here.

class InterviewSessionListCreateView(generics.ListCreateAPIView):
    queryset = InterviewSession.objects.all()  # type: ignore[attr-defined]
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return sessions for the current user
        return InterviewSession.objects.filter(user=self.request.user)  # type: ignore[attr-defined]

class InterviewSessionDetailView(generics.RetrieveAPIView):
    queryset = InterviewSession.objects.all()  # type: ignore[attr-defined]
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user)  # type: ignore[attr-defined]

class StartInterviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role == 'candidate' and (user.has_completed_interview or user.is_blocked_from_interview):
            return Response({'error': 'You are not allowed to take another interview at this time.'}, status=403)
        
        # Fast question selection algorithm
        all_questions: List[Question] = list(Question.objects.all())  # type: ignore[attr-defined]
        if not all_questions:
            return Response({'error': 'No questions available.'}, status=400)

        # Group questions by topic and difficulty
        questions_by_topic_diff: Dict[tuple, List[Question]] = {}
        for q in all_questions:
            key = (q.topic, q.difficulty)
            if key not in questions_by_topic_diff:
                questions_by_topic_diff[key] = []
            questions_by_topic_diff[key].append(q)

        # Define target distribution for 10 questions
        target_distribution = {
            ('Personal', 'easy'): 2,
            ('Technical', 'easy'): 2,
            ('Technical', 'medium'): 2,
            ('Problem Solving', 'medium'): 1,
            ('Teamwork', 'medium'): 1,
            ('Learning', 'medium'): 1,
            ('Architecture', 'hard'): 1,
        }

        selected_questions: List[Question] = []
        total_time = 0
        max_time = 900  # 15 minutes

        # Select questions based on target distribution
        for (topic, difficulty), count in target_distribution.items():
            available = questions_by_topic_diff.get((topic, difficulty), [])
            if available:
                # Randomly select from available questions
                selected = random.sample(available, min(count, len(available)))
                for q in selected:
                    if total_time + q.time_required <= max_time:  # type: ignore[operator]
                        selected_questions.append(q)
                        total_time += q.time_required  # type: ignore[operator]
            
            # If we don't have enough questions, fill with any available questions
            if len(selected_questions) < 10:
                remaining_questions = [q for q in all_questions if q not in selected_questions]
                random.shuffle(remaining_questions)
                
                for q in remaining_questions:
                    if len(selected_questions) >= 10:
                        break
                    if total_time + q.time_required <= max_time:  # type: ignore[operator]
                        selected_questions.append(q)
                        total_time += q.time_required  # type: ignore[operator]

        # If still not enough questions, just take what we have
        if not selected_questions:
            selected_questions = random.sample(all_questions, min(10, len(all_questions)))

        # Create session and session questions
        session = InterviewSession.objects.create(user=request.user)  # type: ignore[attr-defined]
        for q in selected_questions:
            SessionQuestion.objects.create(session=session, question=q)  # type: ignore[attr-defined]

        return Response({
            'session_id': session.id,
            'questions': QuestionSerializer(selected_questions, many=True).data
        })

class SubmitAnswersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        answers = request.data.get('answers', [])
        try:
            session = InterviewSession.objects.get(id=session_id, user=request.user)  # type: ignore[attr-defined]
        except InterviewSession.DoesNotExist:  # type: ignore[attr-defined]
            return Response({'error': 'Session not found.'}, status=404)
        
        for ans in answers:
            qid = ans.get('question_id')
            response = ans.get('response')
            sq = SessionQuestion.objects.filter(session=session, question_id=qid).first()  # type: ignore[attr-defined]
            if sq:
                sq.response = response
                sq.response_time = ans.get('response_time', 0)
                # For demo, mark all as correct if not empty
                sq.is_correct = bool(response)
                sq.save()
        
        session.end_time = timezone.now()
        session.score = sum(1 for a in answers if a.get('response')) / max(len(answers), 1) * 100
        session.save()
        # Mark candidate as completed
        user = request.user
        if user.role == 'candidate':
            user.has_completed_interview = True  # type: ignore[assignment]
            user.save()
        return Response({'success': True, 'score': session.score})

class SessionSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = InterviewSession.objects.get(id=session_id)  # type: ignore[attr-defined]
        except InterviewSession.DoesNotExist:  # type: ignore[attr-defined]
            return Response({'error': 'Session not found.'}, status=404)
        
        # Only allow owner or admin
        if session.user != request.user and request.user.role != 'admin':
            return Response({'error': 'Not authorized.'}, status=403)
        
        serializer = InterviewSessionSerializer(session)
        return Response(serializer.data)

class AdminCandidatesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Not authorized.'}, status=403)
        
        # Get all candidates (users with role 'candidate')
        candidates = User.objects.filter(role='candidate').order_by('-date_joined')  # type: ignore[attr-defined]
        
        candidates_data = []
        for candidate in candidates:
            # Get candidate's interview sessions
            sessions = InterviewSession.objects.filter(user=candidate).order_by('-start_time')  # type: ignore[attr-defined]
            
            candidate_data = {
                'id': candidate.id,
                'username': candidate.username,
                'email': candidate.email,
                'date_joined': candidate.date_joined,
                'total_sessions': sessions.count(),
                'latest_session': None,
                'average_score': 0,
            }
            
            if sessions.exists():
                latest_session = sessions.first()
                candidate_data['latest_session'] = {
                    'id': latest_session.id,
                    'score': latest_session.score,
                    'start_time': latest_session.start_time,
                    'end_time': latest_session.end_time,
                }
                
                # Calculate average score
                avg_score = sessions.aggregate(models.Avg('score'))['score__avg']
                candidate_data['average_score'] = avg_score or 0
            
            candidates_data.append(candidate_data)
        
        return Response(candidates_data)

class AdminCandidateDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, candidate_id):
        if request.user.role != 'admin':
            return Response({'error': 'Not authorized.'}, status=403)
        
        try:
            candidate = User.objects.get(id=candidate_id, role='candidate')  # type: ignore[attr-defined]
        except User.DoesNotExist:  # type: ignore[attr-defined]
            return Response({'error': 'Candidate not found.'}, status=404)
        
        # Get all sessions for this candidate
        sessions = InterviewSession.objects.filter(user=candidate).order_by('-start_time')  # type: ignore[attr-defined]
        
        sessions_data = []
        for session in sessions:
            session_questions = SessionQuestion.objects.filter(session=session)  # type: ignore[attr-defined]
            
            session_data = {
                'id': session.id,
                'score': session.score,
                'start_time': session.start_time,
                'end_time': session.end_time,
                'total_questions': session_questions.count(),
                'correct_answers': session_questions.filter(is_correct=True).count(),
                'average_time': session_questions.aggregate(models.Avg('response_time'))['response_time__avg'] or 0,
                'questions': []
            }
            
            # Get detailed question data
            for sq in session_questions:
                session_data['questions'].append({
                    'question_text': sq.question.text,
                    'question_topic': sq.question.topic,
                    'question_difficulty': sq.question.difficulty,
                    'response': sq.response,
                    'is_correct': sq.is_correct,
                    'response_time': sq.response_time,
                })
            
            sessions_data.append(session_data)
        
        candidate_data = {
            'id': candidate.id,
            'username': candidate.username,
            'email': candidate.email,
            'date_joined': candidate.date_joined,
            'total_sessions': sessions.count(),
            'average_score': sessions.aggregate(models.Avg('score'))['score__avg'] or 0,
            'sessions': sessions_data
        }
        
        return Response(candidate_data)

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Not authorized.'}, status=403)
        
        sessions = InterviewSession.objects.all()  # type: ignore[attr-defined]
        total_sessions = sessions.count()
        avg_score = sessions.aggregate(models.Avg('score'))['score__avg'] or 0
        
        topic_stats: Dict[str, Dict[str, int]] = {}
        miss_count: Dict[int, int] = {}
        
        for sq in SessionQuestion.objects.all():  # type: ignore[attr-defined]
            topic = sq.question.topic
            topic_stats[topic] = topic_stats.get(topic, {'total': 0, 'missed': 0})
            topic_stats[topic]['total'] += 1
            if not sq.is_correct:
                topic_stats[topic]['missed'] += 1
            
            qid = sq.question.id
            if not sq.is_correct:
                miss_count[qid] = miss_count.get(qid, 0) + 1
        
        most_missed = sorted(miss_count.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return Response({
            'total_sessions': total_sessions,
            'avg_score': avg_score,
            'topic_stats': topic_stats,
            'most_missed_questions': most_missed,
        })

class AdminUnblockCandidateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, candidate_id):
        if request.user.role != 'admin':
            return Response({'error': 'Not authorized.'}, status=403)
        
        try:
            candidate = User.objects.get(id=candidate_id, role='candidate')  # type: ignore[attr-defined]
        except User.DoesNotExist:  # type: ignore[attr-defined]
            return Response({'error': 'Candidate not found.'}, status=404)
        
        candidate.has_completed_interview = False  # type: ignore[assignment]
        candidate.is_blocked_from_interview = False  # type: ignore[assignment]
        candidate.save()
        
        return Response({'success': True, 'message': 'Candidate unblocked and can take interview again.'})

class AdminRemoveCandidateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, candidate_id):
        if request.user.role != 'admin':
            return Response({'error': 'Not authorized.'}, status=403)
        try:
            candidate = User.objects.get(id=candidate_id, role='candidate')  # type: ignore[attr-defined]
        except User.DoesNotExist:  # type: ignore[attr-defined]
            return Response({'error': 'Candidate not found.'}, status=404)
        # Delete all interview sessions and related session questions for this candidate
        sessions = InterviewSession.objects.filter(user=candidate)  # type: ignore[attr-defined]
        SessionQuestion.objects.filter(session__in=sessions).delete()  # type: ignore[attr-defined]
        sessions.delete()
        # After removal, block the candidate until admin unblocks
        candidate.has_completed_interview = False  # type: ignore[assignment]
        candidate.is_blocked_from_interview = True  # type: ignore[assignment]
        candidate.save()
        return Response({'success': True, 'message': 'All interview records for candidate removed. Candidate is now blocked until admin unblocks.'})
