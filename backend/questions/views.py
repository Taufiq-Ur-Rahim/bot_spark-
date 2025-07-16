from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Question
from .serializers import QuestionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from users.models import User
from rest_framework.views import APIView
import csv
import io

# Create your views here.

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]

class BulkImportQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Check if user is admin
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if file is uploaded
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        # Check file type
        if not file.name.endswith('.csv'):
            return Response({'error': 'Please upload a CSV file.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Read CSV file
            decoded_file = file.read().decode('utf-8')
            csv_data = csv.DictReader(io.StringIO(decoded_file))
            
            created = 0
            errors = []
            
            for row_num, row in enumerate(csv_data, start=2):  # Start from 2 because row 1 is header
                try:
                    # Validate required fields
                    required_fields = ['text', 'topic', 'difficulty', 'time_required']
                    missing_fields = [field for field in required_fields if not row.get(field)]
                    
                    if missing_fields:
                        errors.append(f"Row {row_num}: Missing fields: {', '.join(missing_fields)}")
                        continue
                    
                    # Validate difficulty
                    if row['difficulty'] not in ['easy', 'medium', 'hard']:
                        errors.append(f"Row {row_num}: Invalid difficulty '{row['difficulty']}'. Must be easy, medium, or hard")
                        continue
                    
                    # Validate time_required
                    try:
                        time_required = int(row['time_required'])
                        if time_required <= 0:
                            errors.append(f"Row {row_num}: time_required must be positive")
                            continue
                    except ValueError:
                        errors.append(f"Row {row_num}: time_required must be a number")
                        continue
                    
                    # Create question
                    Question.objects.create(
                        text=row['text'].strip(),
                        topic=row['topic'].strip(),
                        difficulty=row['difficulty'].lower(),
                        time_required=time_required,
                    )
                    created += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            response_data = {
                'success': True,
                'created': created,
                'total_rows_processed': row_num - 1
            }
            
            if errors:
                response_data['errors'] = errors[:10]  # Limit to first 10 errors
                if len(errors) > 10:
                    response_data['errors'].append(f"... and {len(errors) - 10} more errors")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
