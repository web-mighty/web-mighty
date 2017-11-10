from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed
import json


def profile(request):
    if not request.user.is_authenticated:
        return HttpResponse(status=401)

    if request.method == 'GET':
        profile = request.user.profile
        response_data = {
            'nickname': profile.nickname,
            # 'avatar': profile.avatar.url,
            'created': str(profile.created),
        }
        return JsonResponse(response_data)

    elif request.method == 'POST':
        profile = request.user.profile
        data = json.loads(request.body.decode())

        profile.nickname = data.get('nickname', profile.nickname)
        profile.save()

        return HttpResponse(status=204)

    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
