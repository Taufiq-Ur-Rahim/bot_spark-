from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import QuestionViewSet, BulkImportQuestionsView

urlpatterns = [
    path('bulk_import/', BulkImportQuestionsView.as_view(), name='bulk-import-questions'),
]

router = DefaultRouter()
router.register(r'', QuestionViewSet, basename='question')

urlpatterns += router.urls