from django.http import HttpResponse, JsonResponse
from django.http import HttpResponseNotAllowed, HttpResponseBadRequest
import json

from .room_functions import get_room_list, create_room


def room(request):
    if request.method == 'GET':
        page = request.GET.get('page', 1)
        count_per_page = request.GET.get('count_per_page', 10)

        return JsonResponse(get_room_list(page, count_per_page), safe=False)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return HttpResponse(status=401)

        request_data = json.loads(request.body.decode())
        result_data = create_room(**request_data)

        if result_data is not None:
            return JsonResponse(result_data, status=201)
        else:
            return HttpResponseBadRequest()

    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
