from channels import Channel
from channels.routing import route
from channels.auth import channel_session_user, channel_session_user_from_http
from .consumer_utils import error
from django.core.cache import cache
import json


available_channels = [
    'room-join',
    'room-leave',
    'room-ready',
    'room-start',
    'gameplay-bid',
    'gameplay-deal-miss',
    'gameplay-friend-select',
    'gameplay-play',
]

multiplexer_routings = [
    route('room-join', 'websocket.consumers.room_consumers.room_join_consumer'),
    route('room-leave', 'websocket.consumers.room_consumers.room_leave_consumer'),
    route('room-ready', 'websocket.consumers.room_consumers.room_ready_consumer'),
    route('room-start', 'websocket.consumers.room_consumers.room_start_consumer'),
    route('gameplay-bid', 'websocket.consumers.gameplay_consumers.gameplay_bid_consumer'),
    route('gameplay-deal-miss',
          'websocket.consumers.gameplay_consumers.gameplay_deal_miss_consumer'),
    route('gameplay-friend-select',
          'websocket.consumers.gameplay_consumers.gameplay_friend_select_consumer'),
    route('gameplay-play', 'websocket.consumers.gameplay_consumers.gameplay_play_consumer'),
]


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
    if not message.user.is_authenticated:
        message.reply_channel.send(error('Not Authenticated'))
        message.reply_channel.send({'close': True})
        return

    data = json.loads(message.content['text'])

    if 'nonce' not in data:
        message.reply_channel.send(error('No nonce'))
        return
    if 'action' not in data:
        message.reply_channel.send(error('No action'))
        return
    if 'data' not in data:
        message.reply_channel.send(error('No data'))
        return

    channel = data['action']

    if channel not in available_channels:
        message.reply_channel.send(error('Invalid action'))
        return

    Channel(channel).send({'text': json.dumps(data['data'])})


@channel_session_user
def websocket_disconnect(message):
    if message.user.is_authenticated:
        cache.delete('session:' + message.user.username)
        # TODO: clear more cache about specific user
        # TODO: broadcast disconnection event to user within same room
