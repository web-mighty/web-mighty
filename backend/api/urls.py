from django.conf.urls import url
from api import sign_views, profile_views, room_views

urlpatterns = [
    url(r'^signup/$', sign_views.sign_up, name='sign_up'),
    url(r'^signin/$', sign_views.sign_in, name='sign_in'),
    url(r'^signout/$', sign_views.sign_out, name='sign_out'),
    url(r'^verify_account/(?P<url_code>.+)/$', sign_views.verify_account, name='verify_account'),
    url(r'^verify_session/$', sign_views.verify_session, name='verify_session'),
    url(r'^profile/(?P<username>.+)/$', profile_views.profile, name='profile'),
    url(r'^avatar/$', profile_views.avatar, name='avatar'),
    url(r'^room/$', room_views.room, name='room'),
]
