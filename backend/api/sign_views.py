from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed, HttpResponseForbidden
from django.http import HttpResponseBadRequest
from django.contrib.auth import authenticate, login, logout
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


def sign_in(request):
    if request.method == 'POST':
        request_data = json.loads(request.body.decode())
        username = request_data.get('username', None)
        password = request_data.get('password', None)

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            response_data = {
                'id': user.id,
                'username': user.username,
            }
            return JsonResponse(response_data)
        else:
            return HttpResponse(status=401)  # Unauthorized

    else:
        return HttpResponseNotAllowed(['POST'])


def sign_out(request):
    if request.method == 'GET':
        logout(request)
        return HttpResponse()

    else:
        return HttpResponseNotAllowed(['GET'])
