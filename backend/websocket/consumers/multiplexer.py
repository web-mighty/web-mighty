from channels import Channel
from channels.routing import route
from channels.auth import channel_session_user, channel_session_user_from_http
from .consumer_utils import event, reply_error, event_error
from django.core.cache import cache
from urllib.parse import parse_qs
import json


WEBSOCKET_REJECT_UNAUTHORIZED = 4000
WEBSOCKET_REJECT_DUPLICATE = 4001
WEBSOCKET_DISCONNECT_UNAUTHORIZED = 4010
WEBSOCKET_DISCONNECT_DUPLICATE = 4011

rejection_codes = [
    WEBSOCKET_REJECT_UNAUTHORIZED,
    WEBSOCKET_REJECT_DUPLICATE,
]

available_channels = [
    'room-join',
    'room-leave',
    'room-ready',
    'room-start',
    'gameplay-start',
    'gameplay-bid',
    'gameplay-deal-miss',
    'gameplay-kill',
    'gameplay-friend-select',
    'gameplay-play',
    'gameplay-continue',
]

multiplexer_routings = [
    route('room-join', 'websocket.consumers.room_consumers.room_join_consumer'),
    route('room-leave', 'websocket.consumers.room_consumers.room_leave_consumer'),
    route('room-ready', 'websocket.consumers.room_consumers.room_ready_consumer'),
    route('room-start', 'websocket.consumers.room_consumers.room_start_consumer'),
    route('room-reset', 'websocket.consumers.room_consumers.room_reset_consumer'),
    route('gameplay-start', 'websocket.consumers.gameplay_consumers.gameplay_start_consumer'),
    route('gameplay-bid', 'websocket.consumers.gameplay_consumers.gameplay_bid_consumer'),
    route('gameplay-deal-miss',
          'websocket.consumers.gameplay_consumers.gameplay_deal_miss_consumer'),
    route('gameplay-kill',
          'websocket.consumers.gameplay_consumers.gameplay_kill_consumer'),
    route('gameplay-friend-select',
          'websocket.consumers.gameplay_consumers.gameplay_friend_select_consumer'),
    route('gameplay-play', 'websocket.consumers.gameplay_consumers.gameplay_play_consumer'),
    route('gameplay-continue', 'websocket.consumers.gameplay_consumers.gameplay_continue_consumer'),
]


@channel_session_user_from_http
def websocket_connect(message):
    if not message.user.is_authenticated:
        message.reply_channel.send({'accept': True})
        message.reply_channel.send(event_error('Not authenticated', type='connection-auth'))
        message.reply_channel.send({'close': WEBSOCKET_REJECT_UNAUTHORIZED})
        return

    try:
        if isinstance(message.content['query_string'], bytes):
            query_string = parse_qs(message.content['query_string'].decode('utf-8'))
        elif isinstance(message.content['query_string'], str):
            query_string = parse_qs(message.content['query_string'])
        else:
            query_string = {}
    except UnicodeDecodeError:
        query_string = {}
    except KeyError:
        query_string = {}

    cache_key = 'session:' + message.user.username
    with cache.lock('lock:' + cache_key):
        current_session = cache.get(cache_key)
        # if user is connecting the websocket first time, set the session
        if current_session is None:
            cache.set(cache_key, message.reply_channel.name)
        else:
            if current_session != message.reply_channel.name:
                if 'force' in query_string and 'true' in query_string['force']:
                    Channel(current_session).send({'close': WEBSOCKET_DISCONNECT_DUPLICATE})
                    cache.set(cache_key, message.reply_channel.name)
                else:
                    message.reply_channel.send({'accept': True})
                    message.reply_channel.send(
                        event_error('Session duplication detected', type='connection-dup'))
                    message.reply_channel.send({'close': WEBSOCKET_REJECT_DUPLICATE})
                    return

    message.reply_channel.send({'accept': True})
    message.reply_channel.send(event('connected', {}))


@channel_session_user
def websocket_receive(message):
    try:
        data = json.loads(message.content['text'])
    except ValueError:
        message.reply_channel.send(
            reply_error('Invalid data', nonce='', type='receive'))
        return

    if not message.user.is_authenticated:
        message.reply_channel.send(
            reply_error('Not authenticated', nonce=data.get('nonce', ''), type='receive'))
        message.reply_channel.send({'close': WEBSOCKET_DISCONNECT_UNAUTHORIZED})
        return

    cache_key = 'session:' + message.user.username
    with cache.lock('lock:' + cache_key):
        current_session = cache.get(cache_key)

        if message.reply_channel.name != current_session:
            message.reply_channel.send(
                reply_error('Session duplication detected', nonce=data.get('nonce', ''), type='receive'))
            message.reply_channel.send({'close': WEBSOCKET_DISCONNECT_DUPLICATE})
            return

        if 'nonce' not in data:
            message.reply_channel.send(
                reply_error('No nonce', type='receive'))
            return
        if 'action' not in data:
            message.reply_channel.send(
                reply_error('No action', nonce=data['nonce'], type='receive'))
            return
        if 'data' not in data:
            message.reply_channel.send(
                reply_error('No data', nonce=data['nonce'], type='receive'))
            return

        channel = data['action']

        if channel not in available_channels:
            message.reply_channel.send(
                reply_error('Invalid action', nonce=data['nonce'], type='receive'))
            return

        data['data']['nonce'] = data['nonce']
        data['data']['username'] = message.user.username
        data['data']['reply'] = message.reply_channel.name
        Channel(channel).send(data['data'])


@channel_session_user
def websocket_disconnect(message):
    if message.content['code'] in rejection_codes:
        # The connection is closed due to rejection
        # Did nothing, so do nothing
        return

    if message.user.is_authenticated:
        session_cache_key = 'session:' + message.user.username
        with cache.lock('lock:' + session_cache_key):
            session = cache.get(session_cache_key)
            if session == message.reply_channel.name:
                cache.delete(session_cache_key)

        player_room_cache_key = 'player-room:' + message.user.username
        with cache.lock('lock:' + player_room_cache_key):
            room_id = cache.get(player_room_cache_key)

            if room_id is not None:
                data = {
                    'nonce': '',
                    'username': message.user.username,
                    'disconnected': True,
                    'reply': message.reply_channel.name,
                }

                Channel('room-leave').send(data)
