from channels import Channel
from channels.auth import channel_session_user, channel_session_user_from_http
from .consumer_utils import error
from django.core.cache import cache


@channel_session_user_from_http
def websocket_connect(message):
    if not message.user.is_authenticated:
        message.reply_channel.send({'accept': True})
        message.reply_channel.send(error('Not Authenticated'))
        message.reply_channel.send({'close': True})
        return

    cache_key = 'session:' + message.user.username
    current_session = cache.get(cache_key)

    # if user is connecting the websocket first time, set the session
    if current_session is None:
        cache.set(cache_key, message.reply_channel.name)
    else:
        # TODO: relogin logic with Request structure
        if current_session != message.reply_channel.name:
            message.reply_channel.send({'accept': True})
            message.reply_channel.send(error('Session duplication detected'))
            message.reply_channel.send({'close': True})
            return

    message.reply_channel.send({'accept': True})


@channel_session_user
def websocket_receive(message):
    # TODO: handle malformed request
    # TODO: multiplex message to channels based on Action
    pass


@channel_session_user
def websocket_disconnect(message):
    if message.user.is_authenticated:
        cache.delete('session:' + message.user.username)
        # TODO: clear more cache about specific user
        # TODO: broadcast disconnection event to user within same room
