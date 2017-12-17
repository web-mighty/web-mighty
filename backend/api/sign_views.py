from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed
from django.http import HttpResponseBadRequest
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q
from .models import create_user
from backend.settings import DOMAIN_NAME
import json
import binascii
from base64 import b64encode, b64decode
import uuid
from datetime import datetime, timedelta
from urllib.parse import quote_plus


def sign_up(request):
    if request.method == 'POST':
        request_data = json.loads(request.body.decode())
        username = request_data.get('username', None)
        password = request_data.get('password', None)
        email = request_data.get('email', None)
        nickname = request_data.get('nickname', None)

        if not all([username, password, email, nickname]):
            return HttpResponseBadRequest()

        userset = User.objects.filter(Q(username=username) | Q(email=email))
        if userset.exists():
            user = userset[0]
            if user.is_active:
                return HttpResponseBadRequest()
            if datetime.now() - user.created > timedelta(minutes=30):
                user.delete()
            else:
                return HttpResponseBadRequest()

        user = User(
            username=username,
            password=password,
            email=email,
        )

        try:
            user.clean_fields()
        except ValidationError:
            return HttpResponseBadRequest()

        if ':' in nickname:
            return HttpResponseBadRequest()

        user = create_user(
            username=username,
            password=password,
            email=email,
            nickname=nickname,
            is_active=False,
        )

        if user is None:
            return HttpResponseBadRequest()

        code = str(uuid.uuid4())
        with cache.lock('lock:verify-account:' + username):
            cache.set('verify-account:' + username, code)

        url_code = quote_plus(b64encode(':'.join((username, code)).encode()).decode())

        url = DOMAIN_NAME + 'verify_account/{}/'.format(url_code)
        send_mail(
            'Web Mighty: Email Verification',
            '''
            To activate your account, please visit the following link.

            {url}
            '''.format(url=url),
            'no-reply@mail.web-mighty.net',
            [email],
            fail_silently=True,
        )

        return HttpResponse(status=200)

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


def verify_account(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    request_data = json.loads(request.body.decode())
    token = request_data.get('token')

    try:
        username, verify_token = b64decode(token.encode()).decode().split(':')
    except binascii.Error:
        return HttpResponseBadRequest()
    except ValueError:
        return HttpResponseBadRequest()

    with cache.lock('lock:verify-account:' + username):
        token = cache.get('verify-account:' + username)

        if token == verify_token:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return HttpResponseBadRequest()

            user.is_active = True
            user.save()
            cache.delete('verify-account:' + username)
            return HttpResponse(status=201)

    return HttpResponseBadRequest()


@ensure_csrf_cookie
def verify_session(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            username = request.user.username

            response_data = {
                'username': username,
            }

            with cache.lock('lock:player-room:' + username):
                room_id = cache.get('player-room:' + username)
                if room_id is not None:
                    response_data['room_id'] = room_id

            return JsonResponse(response_data)
        else:
            return HttpResponse(status=401)
    else:
        return HttpResponseNotAllowed(['GET'])
