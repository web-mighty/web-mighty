from django.conf.urls import url
from api import sign_views, profile_views, room_views

urlpatterns = [
    url(r'^signup/$', sign_views.sign_up, name='sign_up'),
    url(r'^signin/$', sign_views.sign_in, name='sign_in'),
    url(r'^signout/$', sign_views.sign_out, name='sign_out'),
    url(r'^profile/$', profile_views.profile, name='profile'),
    url(r'^room/$', room_views.room, name='room'),
]
