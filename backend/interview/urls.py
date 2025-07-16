from django.urls import path
from .views import InterviewSessionListCreateView, InterviewSessionDetailView, StartInterviewView, SubmitAnswersView, SessionSummaryView, AdminAnalyticsView, AdminCandidatesView, AdminCandidateDetailView, AdminUnblockCandidateView, AdminRemoveCandidateView

urlpatterns = [
    path('sessions/', InterviewSessionListCreateView.as_view(), name='interview-session-list-create'),
    path('sessions/<int:pk>/', InterviewSessionDetailView.as_view(), name='interview-session-detail'),
    path('start/', StartInterviewView.as_view(), name='interview-start'),
    path('submit/', SubmitAnswersView.as_view(), name='interview-submit'),
    path('summary/<int:session_id>/', SessionSummaryView.as_view(), name='interview-summary'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/candidates/', AdminCandidatesView.as_view(), name='admin-candidates'),
    path('admin/candidates/<int:candidate_id>/', AdminCandidateDetailView.as_view(), name='admin-candidate-detail'),
    path('admin/candidates/<int:candidate_id>/unblock/', AdminUnblockCandidateView.as_view(), name='admin-unblock-candidate'),
    path('admin/candidates/<int:candidate_id>/remove/', AdminRemoveCandidateView.as_view(), name='admin-remove-candidate'),
]