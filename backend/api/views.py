from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed, HttpResponseForbidden
from django.http import HttpResponseBadRequest
from .models import create_user, User, Profile, GameHistory
import json


def sign_up(request):
    if request.method == 'POST':
        request_data = json.loads(request.body.decode())
        username = request_data.get('username', None)
        password = request_data.get('password', None)
        email = request_data.get('email', None)
        nickname = request_data.get('nickname', None)

        if not all([username, password, email, nickname]):
            return HttpResponseBadRequest()

        user = create_user(
            username=username,
            password=password,
            email=email,
            nickname=nickname,
        )

        if user is None:
            return HttpResponseBadRequest()

        return HttpResponse(status=201)

    else:
        return HttpResponseNotAllowed(['POST'])
