from channels import Channel, Group
from .card import shuffled_card, card_score
from .consumer_utils import event, reply_error, response
from django.core.cache import cache
from .state import RoomState


def gameplay_start_consumer(message):
    data = message.content
    room_id = data['room_id']

    room = cache.get('room:' + room_id)
    player_number = room['options']['player_number']

    cards = shuffled_card()

    # dealing
    if player_number == 5:
        cards_per_person = 10

    elif player_number == 6:
        cards_per_person = 8

    else:
        # this is unexpected exception, but can be validated before
        return

    for i in range(player_number):
        dealed_card = cards[:cards_per_person]
        room['players'][i]['cards'] = dealed_card

        reply_channel = Channel(room['players'][i]['reply'])
        data = {
            'cards': dealed_card,
        }
        reply_channel.send(event('gameplay-deal', data))

        del cards[:cards_per_person]

    room['game']['floor_cards'] = cards
    room['game']['state'] = RoomState.BIDDING

    cache.set('room:' + room_id, room)

    # send bidding event
    event_data = {
        'player': {
            'username': room['players'][0]['username'],
        }
    }
    Group(room_id).send(event('gameplay-bidding', event_data))


def gameplay_bid_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    room_id = cache.get('player-room:' + username)

    if room_id is None:
        reply_channel.send(reply_error(
            'You are not in room',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    score = data.get('score', None)
    giruda = data.get('giruda', None)
    try_bid = data.get('bid', None)

    if not all([score, giruda, try_bid]):
        reply_channel.send(reply_error(
            'Invalid request',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    room = cache.get('room:' + room_id)
    turn = room['game']['turn']

    player_number = room['options']['player_number']

    if room['game']['state'] is not RoomState.BIDDING:
        reply_channel.send(reply_error(
            'Invalid request',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    if room['players'][turn]['username'] != username:
        reply_channel.send(reply_error(
            'Not your turn',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    if not try_bid:
        room['players'][turn]['bid'] = 2

        bidder_count = 0
        bidder = ''
        bidder_turn = 0
        bidder_reply = ''
        for i, player in enumerate(room['players']):
            if player['bid'] == 1:
                bidder_count = bidder_count + 1
                bidder = player['username']
                bidder_turn = i
                bidder_reply = player['reply']

        if bidder_count == 1:
            turn = bidder_turn
            reply_channel = Channel(bidder_reply)
            room['game']['president'] = bidder
            room['game']['current_bid']['bidder'] = bidder
            room['game']['bid_score'] = room['game']['current_bid']['score']
            room['game']['giruda'] = room['game']['current_bid']['giruda']

            players = room['players'][turn:] + room['players'][:turn]
            room['players'] = players
            room['game']['turn'] = 0

            event_data = {
                'player': bidder,
                'score': room['game']['bid_score'],
                'giruda': room['game']['giruda'],
            }

            Group(room_id).send(event(
                'gameplay-president-elected',
                event_data,
            ))

            if player_number == 5:
                room['game']['state'] = RoomState.FRIEND_SELECTING
                event_data = {
                    'player': bidder,
                }
                Group(room_id).send(event(
                    'gameplay-friend-selecting',
                    event_data,
                ))
            elif player_number == 6:
                room['game']['state'] = RoomState.KILL_SELECTING
                event_data = {
                    'player': bidder,
                }
                Group(room_id).send(event(
                    'gameplay-killing',
                    event_data,
                ))

            cache.set('room:' + room_id, room)
            return

        for i in range(turn + 1, turn + player_number):
            j = i % player_number
            player = room['players'][j]
            if player['bid'] != 2:
                room['game']['turn'] = i
                turn = i
                break

        room['game']['turn'] = turn
        cache.set('room:' + room_id, room)

        reply_channel.send(response(
            {},
            nonce=nonce,
        ))
        event_data = {
            'player': username,
            'bid': False,
        }
        Group(room_id).send(event(
            'gameplay-bid',
            event_data,
        ))
        event_data = {
            'player': room['players'][turn]['username'],
        }
        Group(room_id).send(event(
            'gameplay-bidding',
            event_data,
        ))
        return

    if giruda not in 'SDCHN':
        reply_channel.send(reply_error(
            'Invalid giruda',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    if player_number == 5:
        miminum_bid = 13
    elif player_number == 6:
        miminum_bid = 14
    else:
        miminum_bid = 13

    tuned_score = score if giruda != 'N' else score - 1

    if tuned_score < miminum_bid or score > 20:
        reply_channel.send(reply_error(
            'Invalid score',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    current_bid = room['game']['current_bid']
    tuned_current_bid = current_bid['score'] if current_bid['giruda'] != 'N' else current_bid['score'] - 1

    if tuned_score < miminum_bid or tuned_current_bid >= tuned_score:
        reply_channel.send(reply_error(
            'Not enough score',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    room['game']['current_bid']['bidder'] = username
    room['game']['current_bid']['score'] = score
    room['game']['current_bid']['giruda'] = giruda
    room['player'][turn]['bid'] = 1

    for i in range(turn + 1, turn + player_number):
        j = i % player_number
        player = room['players'][j]
        if player['bid'] != 2:
            room['game']['turn'] = i
            turn = i
            break

    room['game']['turn'] = turn

    cache.set('room:' + room_id, room)

    reply_channel.send(response(
        {},
        nonce=nonce,
    ))
    event_data = {
        'player': username,
        'bid': True,
        'score': score,
        'giruda': giruda,
    }
    Group(room_id).send(event(
        'gameplay-bid',
        event_data,
    ))
    event_data = {
        'player': room['players'][turn]['username'],
    }
    Group(room_id).send(event(
        'gameplay-bidding',
        event_data,
    ))


def gameplay_deal_miss_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    room_id = cache.get('player-room:' + username)

    if room_id is None:
        reply_channel.send(reply_error(
            'You are not in room',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    room = cache.get('room:' + room_id)

    if room['game']['state'].value > 3:  # FRIEND_SELECTING
        reply_channel.send(reply_error(
            'Invalid timing',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    cards = []

    for player in room['players']:
        if player['username'] == username:
            cards = player['cards']
            score = card_score(cards)
            break

    if score > 0:
        reply_channel.send(reply_error(
            'Invalid score',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    event_data = {
        'player': username,
        'cards': cards,
    }

    Group(room_id).send(event(
        'gameplay-deal-miss',
        event_data,
    ))
    Channel('room-reset').send({'room_id': room_id})


def gameplay_friend_select_consumer(message):
    pass


def gameplay_play_consumer(message):
    pass
