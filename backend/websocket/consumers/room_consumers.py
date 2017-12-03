from channels import Channel, Group
from django.core.cache import cache
from django.contrib.auth.hashers import check_password
from api.models import Room
from .consumer_utils import reply_error, response, event


def room_join_consumer(message):
    data = message.content
    reply_channel = Channel(data['reply'])
    nonce = data['nonce']
    username = data['username']
    room_id = data.get('room_id', None)
    password = data.get('password', None)

    if room_id is None:
        reply_channel.send(
            reply_error('No room_id', nonce=nonce, type='room-join'))
        return

    player_room_cache_key = 'player-room:' + username
    room_cache = cache.get(player_room_cache_key)

    if room_cache is not None:
        reply_channel.send(reply_error(
            'You are already in a room',
            nonce=nonce,
            type='room-join',
        ))
        return

    try:
        room = Room.objects.get(room_id=room_id)
    except Room.DoesNotExist:
        reply_channel.send(
            reply_error('Room does not exist', nonce=nonce, type='room-join'))
        return

    # xor?
    if (password is None and room.is_private) or (password is not None and not room.is_private):
        reply_channel.send(
            reply_error('Password mismatch', nonce=nonce, type='room-join'))
        return

    if room.is_private:
        if not check_password(password, room.password):
            reply_channel.send(
                reply_error('Password mismatch', nonce=nonce, type='room-join'))
            return

    room_cache_key = 'room:' + room_id
    player_room_cache_key = 'player-room:' + username

    room_cache = cache.get(room_cache_key)

    if len(room_cache['players']) >= room_cache['options']['player_number']:
        reply_channel.send(
            reply_error('Room is full', nonce=nonce, type='room'))
        return

    player_data = {
        'username': username,
        'ready': False,
    }

    response_data = {
        'room_id': room_id,
        'title': room.title,
        'players': room_cache['players'],
    }

    event_data = {
        'player': username,
    }

    room_cache['players'].append(player_data)

    cache.set(room_cache_key, room_cache)
    cache.set(player_room_cache_key, room_id)

    reply_channel.send(response(response_data, nonce=nonce))

    Group(room_id).add(reply_channel)
    Group(room_id).send(event('room-join', event_data))


def room_leave_consumer(message):
    data = message.content
    reply_channel = Channel(data['reply'])
    nonce = data['nonce']
    username = data['username']
    disconnected = data.get('disconnected', False)

    player_room_cache_key = 'player-room:' + username

    room_id = cache.get(player_room_cache_key)

    if room_id is None:
        reply_channel.send(
            reply_error('You are currently not in the room', nonce=nonce, type='room-leave'))
        return

    room_cache_key = 'room:' + room_id
    room_cache = cache.get(room_cache_key)

    if room_cache is None:
        try:
            room = Room.objects.get(room_id=room_id)
            room.delete()
        except Room.DoesNotExist:
            pass
        Group(room_id).discard(reply_channel)
        cache.delete(player_room_cache_key)
        return

    found = False
    for i, player in enumerate(room_cache['players']):
        if player['username'] == username:
            del room_cache['players'][i]
            found = True
            break

    if not found:
        reply_channel.send(
            reply_error('You are currently not in the room', nonce=nonce, type='room-leave'))
        return

    if len(room_cache['players']) == 0:
        try:
            room = Room.objects.get(room_id=room_id)
            room.delete()
        except Room.DoesNotExist:
            pass
        Group(room_id).discard(reply_channel)
        cache.delete(player_room_cache_key)
        return

    cache.set(room_cache_key, room_cache)
    cache.delete(player_room_cache_key)

    event_data = {
        'player': username,
    }

    if not disconnected:
        reply_channel.send(
            response({}, nonce=nonce))

    Group(room_id).discard(reply_channel)
    Group(room_id).send(event('room-leave', event_data))

    # only when game is playing
    if room_cache['is_playing']:
        Channel('room-reset').send({'room_id': room_id})


def room_ready_consumer(message):
    data = message.content
    reply_channel = Channel(data['reply'])
    nonce = data['nonce']
    username = data['username']
    ready = data.get('ready', None)

    if ready is None:
        reply_channel.send(
            reply_error('No ready', nonce=nonce, type='room-ready'))

    player_room_cache_key = 'player-room:' + username

    room_id = cache.get(player_room_cache_key)

    if room_id is None:
        reply_channel.send(
            reply_error('You are currently not in the room', nonce=nonce, type='room-ready'))
        return

    room_cache_key = 'room:' + room_id
    room_cache = cache.get(room_cache_key)

    found = False
    for i, player in enumerate(room_cache['players']):
        if player['username'] == username:
            room_cache['players'][i]['ready'] = ready
            found = True
            break

    if not found:
        reply_channel.send(
            reply_error('You are currently not in the room', nonce=nonce, type='room-ready'))
        return

    cache.set(room_cache_key, room_cache)

    response_data = {
        'ready': ready,
    }

    event_data = {
        'player': username,
        'ready': ready,
    }

    reply_channel.send(response(response_data, nonce=nonce))
    Group(room_id).send(event('room-ready', event_data))


def room_start_consumer(message):
    data = message.content
    reply_channel = Channel(data['reply'])
    nonce = data['nonce']
    username = data['username']

    player_room_cache_key = 'player-room:' + username

    room_id = cache.get(player_room_cache_key)

    if room_id is None:
        reply_channel.send(
            reply_error('You are currently not in the room', nonce=nonce, type='room-start'))
        return

    room_cache_key = 'room:' + room_id
    room_cache = cache.get(room_cache_key)

    if len(room_cache['players']) < room_cache['options']['player_number']:
        reply_channel.send(
            reply_error('Not enough players', nonce=nonce, type='room-start'))
        return

    if room_cache['players'][0]['username'] != username:
        reply_channel.send(
            reply_error('You are not host', nonce=nonce, type='room-start'))
        return

    found = False
    ready_count = 0
    for player in room_cache['players']:
        if player['username'] == username:
            found = True
        if player['ready'] is True:
            ready_count += 1

    if not found:
        reply_channel.send(
            reply_error('You are currently not in the room', nonce=nonce, type='room-start'))
        return

    if ready_count < room_cache['options']['player_number']:
        reply_channel.send(
            reply_error('Not all people are ready', nonce=nonce, type='room-start'))
        return

    room_cache['is_playing'] = True

    cache.set(room_cache_key, room_cache)

    reply_channel.send(response({}, nonce=nonce))
    Group(room_id).send(event('room-start', {}))


def room_reset_consumer(message):
    data = message.content
    room_id = data['room_id']

    room_cache_key = 'room:' + room_id
    room_cache = cache.get(room_cache_key)

    if room_cache is None:
        return

    if len(room_cache['players']) == 0:
        return

    for player in room_cache['players']:
        player['ready'] = False

    new_room_data = {
        'room_id': room_id,
        'players': room_cache['players'],
        'options': {
            'player_number': room_cache['options']['player_number'],
        },
        'state': {
            'round': 0,
            'turn': 0,
            'giruda': '',
            'joker_call': False,
            'joker_suit': '',
            'table_cards': [],
        },
    }

    cache.set(room_cache_key, new_room_data)

    event_data = {
        'room_id': room_id,
        'players': new_room_data['players'],
    }

    Group(room_id).send(event('room-reset', event_data))
