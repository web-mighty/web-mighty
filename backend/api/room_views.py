from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed, HttpResponseBadRequest
import json

from .room_functions import get_all_room, create_room


def room(request):
    if request.method == 'GET':
        return JsonResponse(get_all_room(), safe=False)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return HttpResponse(status=401)

        request_data = json.loads(request.body.decode())
        success = create_room(**request_data)

        if success:
            return HttpResponse(status=201)
        else:
            return HttpResponseBadRequest()

    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
