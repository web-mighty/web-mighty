from channels import Channel, Group
from django.core.cache import cache
from django.contrib.auth.hashers import check_password
from api.models import Room
from .consumer_utils import reply_error, response, event, reset_room_data
from .consumer_utils import new_player_data
from .state import RoomState
from websocket.consumers.ai import AI


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
    with cache.lock('lock:' + player_room_cache_key):
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

        with cache.lock('lock:' + room_cache_key):
            room_cache = cache.get(room_cache_key)

            if room_cache is None:
                room.delete()
                reply_channel.send(
                    reply_error('Room does not exist', nonce=nonce, type='room-join'))
                return

            if len(room_cache['players']) >= room_cache['options']['player_number']:
                reply_channel.send(
                    reply_error('Room is full', nonce=nonce, type='room'))
                return

            player_data = new_player_data(
                username=username,
                reply=reply_channel.name,
                ready=False,
            )

            event_data = {
                'player': username,
            }

            room_cache['players'].append(player_data)

            response_players = []

            for player in room_cache['players']:
                response_players.append({
                    'username': player['username'],
                    'ready': player['ready'],
                })

            response_data = {
                'room_id': room_id,
                'title': room.title,
                'player_number': room_cache['options']['player_number'],
                'players': response_players,
            }

            room.player_count += 1
            room.save()
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
    with cache.lock('lock:' + player_room_cache_key):

        room_id = cache.get(player_room_cache_key)

        if room_id is None:
            reply_channel.send(
                reply_error('You are currently not in the room', nonce=nonce, type='room-leave'))
            return

        room_cache_key = 'room:' + room_id
        with cache.lock('lock:' + room_cache_key):
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

            Group(room_id).discard(reply_channel)
            cache.delete(player_room_cache_key)

            if not disconnected:
                reply_channel.send(
                    response({}, nonce=nonce))
            player_count = len(room_cache['players'])

            if player_count == 0:
                try:
                    room = Room.objects.get(room_id=room_id)
                    room.delete()
                except Room.DoesNotExist:
                    pass
            else:
                cache.set(room_cache_key, room_cache)
                try:
                    room = Room.objects.get(room_id=room_id)
                    room.player_count -= 1
                    room.save()
                except Room.DoesNotExist:
                    pass

            event_data = {
                'player': username,
            }

            Group(room_id).send(event('room-leave', event_data))

            # only when game is playing
            if room_cache['game']['state'] is not RoomState.NOT_PLAYING:
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

    with cache.lock('lock:' + player_room_cache_key):
        room_id = cache.get(player_room_cache_key)

        if room_id is None:
            reply_channel.send(
                reply_error('You are currently not in the room', nonce=nonce, type='room-ready'))
            return

    room_cache_key = 'room:' + room_id
    with cache.lock('lock:' + room_cache_key):
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

    with cache.lock('lock:' + player_room_cache_key):
        room_id = cache.get(player_room_cache_key)

        if room_id is None:
            reply_channel.send(
                reply_error('You are currently not in the room', nonce=nonce, type='room-start'))
            return

    room_cache_key = 'room:' + room_id
    with cache.lock('lock:' + room_cache_key):
        room_cache = cache.get(room_cache_key)

        if room_cache['game']['state'] is not RoomState.NOT_PLAYING:
            reply_channel.send(
                reply_error('You cannot start at playing', nonce=nonce, type='room-start'))
            return

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

        cache.set(room_cache_key, room_cache)

        reply_channel.send(response({}, nonce=nonce))

        # yeah, start it!
        Channel('gameplay-start').send({'room_id': room_id})


def room_reset_consumer(message):
    data = message.content
    room_id = data['room_id']

    room_cache_key = 'room:' + room_id
    with cache.lock('lock:' + room_cache_key):
        room_cache = cache.get(room_cache_key)

        if room_cache is None:
            return

        if len(room_cache['players']) == 0:
            return

        new_room_data = reset_room_data(room_cache)

        remove_indexes = []
        for i, p in enumerate(new_room_data['players']):
            if p['username'].startswith('*'):
                remove_indexes.append(i)

        for i in remove_indexes[::-1]:
            del new_room_data['players'][i]

        try:
            room_model = Room.objects.get(room_id=room_id)
            player_count = len(new_room_data['players'])
            if player_count == 0:
                room_model.delete()
            room_model.player_count = player_count
            room_model.save()
        except Room.DoesNotExist:
            pass
        cache.set(room_cache_key, new_room_data)

        event_data = {
            'players': [
                {'username': p['username'], 'ready': p['ready']}
                for p in new_room_data['players']
            ],
        }

        Group(room_id).send(event('room-reset', event_data))


def room_ai_add_consumer(message):
    data = message.content
    reply_channel = Channel(data['reply'])
    nonce = data['nonce']
    username = data['username']

    player_room_cache_key = 'player-room:' + username

    with cache.lock('lock:' + player_room_cache_key):
        room_id = cache.get(player_room_cache_key)

        if room_id is None:
            reply_channel.send(
                reply_error('You are currently not in the room', nonce=nonce, type='room-ai-add'))
            return

    room_cache_key = 'room:' + room_id
    with cache.lock('lock:' + room_cache_key):
        room = cache.get(room_cache_key)

        if room['game']['state'] is not RoomState.NOT_PLAYING:
            reply_channel.send(
                reply_error('You cannot add AI at playing', nonce=nonce, type='room-ai-add'))
            return

        if len(room['players']) >= room['options']['player_number']:
            reply_channel.send(
                reply_error('Room is full', nonce=nonce, type='room-ai-add'))
            return

        if room['players'][0]['username'] != username:
            reply_channel.send(
                reply_error('You are not host', nonce=nonce, type='room-ai-add'))
            return

        try:
            room_model = Room.objects.get(room_id=room_id)
        except Room.DoesNotExist:
            reply_channel.send(
                reply_error('Room does not exists', nonce=nonce, type='room-ai-add'))
            return

        nicknames = ['doge', 'gon', 'eom', 'egger', 'ha']
        altered_nicknames = ['doge', 'gon', 'eom', 'egger', 'ha']

        for p in room['players']:
            if p['username'].startswith('*AI-'):
                altered_nicknames.remove(p['username'][4:])

        ind = nicknames.index(altered_nicknames[0])

        ai = AI(ind)
        room['players'].append(ai)
        room_model.player_count += 1
        room_model.save()
        cache.set('room:' + room_id, room)

        reply_channel.send(response({}, nonce=nonce))
        event_data = {
            'player': ai['username'],
            'ai': True,
        }
        Group(room_id).send(event('room-join', event_data))

        event_data = {
            'player': ai['username'],
            'ready': True,
        }
        Group(room_id).send(event('room-ready', event_data))


def room_ai_delete_consumer(message):
    data = message.content
    reply_channel = Channel(data['reply'])
    nonce = data['nonce']
    username = data['username']
    ai_name = data.get('ai_name', None)

    if ai_name is None:
        reply_channel.send(
            reply_error('No ai_name', nonce=nonce, type='room-ai-delete'))
        return

    player_room_cache_key = 'player-room:' + username

    with cache.lock('lock:' + player_room_cache_key):
        room_id = cache.get(player_room_cache_key)

        if room_id is None:
            reply_channel.send(
                reply_error('You are currently not in the room', nonce=nonce, type='room-ai-delete'))
            return

    room_cache_key = 'room:' + room_id
    with cache.lock('lock:' + room_cache_key):
        room = cache.get(room_cache_key)

        if room['game']['state'] is not RoomState.NOT_PLAYING:
            reply_channel.send(
                reply_error('You cannot delete AI at playing', nonce=nonce, type='room-ai-delete'))
            return

        if room['players'][0]['username'] != username:
            reply_channel.send(
                reply_error('You are not host', nonce=nonce, type='room-ai-delete'))
            return

        found = False
        for i, p in enumerate(room['players']):
            if p['username'] == ai_name:
                del room['players'][i]
                found = True
                break

        if not found:
            reply_channel.send(
                reply_error('AI not found', nonce=nonce, type='room-ai-delete'))
            return

        try:
            room_model = Room.objects.get(room_id=room_id)
        except Room.DoesNotExist:
            reply_channel.send(
                reply_error('Room does not exists', nonce=nonce, type='room-ai-add'))
            return

        room_model.player_count -= 1
        room_model.save()
        cache.set('room:' + room_id, room)

        reply_channel.send(response({}, nonce=nonce))
        event_data = {
            'player': ai_name,
            'ai': True,
        }
        Group(room_id).send(event('room-leave', event_data))
