from django.http import JsonResponse
from django.http import HttpResponseNotAllowed
from django.db.models import Count, F
from django.core.cache import cache
from .models import User


def hall_of_fame(request):
    if request.method == 'GET':
        cache_key = 'database:hall-of-fame'
        with cache.lock('lock:' + cache_key):
            data = cache.get(cache_key)
            if data is not None:
                return JsonResponse(data)
            users = User.objects.annotate(wins=Count('win_histories'), avatar=F('profile__avatar'))
            ranks = users.values('username', 'wins', 'avatar').order_by('-wins')[:10]
            ranks_list = list(ranks)
            cache.set(cache_key, ranks_list, timeout=60)
            return JsonResponse(ranks_list, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])
