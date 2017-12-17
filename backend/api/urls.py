from django.conf.urls import url
from api import sign_views, profile_views, room_views, hall_of_fame_views

urlpatterns = [
    url(r'^signup/$', sign_views.sign_up, name='sign_up'),
    url(r'^signin/$', sign_views.sign_in, name='sign_in'),
    url(r'^signout/$', sign_views.sign_out, name='sign_out'),
    url(r'^verify_account/$', sign_views.verify_account, name='verify_account'),
    url(r'^verify_session/$', sign_views.verify_session, name='verify_session'),
    url(r'^profile/(?P<username>.+)/$', profile_views.profile, name='profile'),
    url(r'^avatar/$', profile_views.avatar, name='avatar'),
    url(r'^room/$', room_views.room, name='room'),
    url(r'^hall_of_fame/$', hall_of_fame_views.hall_of_fame, name='hall_of_fame'),
]
