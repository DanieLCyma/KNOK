from django.urls import path
from .views import *

urlpatterns = [
    # path('login/', login, name='login'),
    path('generate-followup-question/tts/', generate_followup_question, name='generate_followup_question'),
    path('generate-resume-question/', generate_resume_question, name='generate_resume_question'),
    path("healthz", health_check),
]