from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed, HttpResponseBadRequest
from django.http import HttpResponseForbidden, HttpResponseNotFound
from .models import Profile
from PIL import Image
import json
import os


def profile(request, username=None):
    if request.method == 'GET':
        try:
            profile = Profile.objects.get(
                user__username=username
            )
        except Profile.DoesNotExist:
            return HttpResponseNotFound()

        response_data = {
            'user': {
                'username': username,
            },
            'nickname': profile.nickname,
            'avatar': profile.avatar.url,
            'created': str(profile.created),
        }
        return JsonResponse(response_data)

    elif request.method == 'PUT':
        if not request.user.is_authenticated:
            return HttpResponse(status=401)

        if request.user.username != username:
            return HttpResponseForbidden()

        profile = request.user.profile
        data = json.loads(request.body.decode())

        profile.nickname = data.get('nickname', profile.nickname)
        profile.save()

        return HttpResponse(status=204)

    else:
        return HttpResponseNotAllowed(['GET', 'PUT'])


def avatar(request):
    if not request.user.is_authenticated:
        return HttpResponse(status=401)

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    previous_avatar_path = request.user.profile.avatar.path

    image = request.FILES.get('avatar', None)

    if image is None:
        return HttpResponseBadRequest()

    if image.size > 1024 * 1024:  # 1MB
        return HttpResponse(status=413)

    # TODO: resize image

    profile = request.user.profile
    profile.avatar = image

    try:
        Image.open(image).verify()
    except OSError:
        return HttpResponseBadRequest()

    profile.save()

    try:
        os.remove(previous_avatar_path)
    except OSError:
        pass

    return HttpResponse(status=204)
