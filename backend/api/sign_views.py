from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed
from django.http import HttpResponseBadRequest
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import create_user
from backend.settings import DOMAIN_NAME
import json
import binascii
from base64 import b64encode, b64decode
import uuid
from datetime import datetime, timedelta


def sign_up(request):
    if request.method == 'POST':
        request_data = json.loads(request.body.decode())
        username = request_data.get('username', None)
        password = request_data.get('password', None)
        email = request_data.get('email', None)
        nickname = request_data.get('nickname', None)

        if not all([username, password, email, nickname]):
            return HttpResponseBadRequest()

        userset = User.objects.filter(username=username)
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
        cache.set('verify-account:' + username, code)

        url_code = b64encode(':'.join((username, code)).encode()).decode()

        url = DOMAIN_NAME + 'api/verify_account/{}/'.format(url_code)
        send_mail(
            'Web Mighty: Email Verification',
            '''
            To activate your account, please visit the following link.

            {url}
            '''.format(url=url),
            'web-mighty@vbchunguk.me',
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


def verify_account(request, url_code):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        username, verify_code = b64decode(url_code.encode()).decode().split(':')
    except binascii.Error:
        return HttpResponseBadRequest()

    code = cache.get('verify-account:' + username)

    if code == verify_code:
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
            response_data = {
                'username': request.user.username,
            }
            return JsonResponse(response_data)
        else:
            return HttpResponse(status=401)
    else:
        return HttpResponseNotAllowed(['GET'])
