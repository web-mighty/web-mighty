import json


def _to_text(obj):
    return {'text': obj}


# for testing
def request(action, data, nonce=''):
    ret = {
        'nonce': nonce,
        'action': action,
        'data': data,
    }

    return _to_text(json.dumps(ret))


def response(result, nonce=''):
    ret = {
        'nonce': nonce,
        'success': True,
        'result': result,
    }

    return _to_text(json.dumps(ret))


def event(event, data):
    ret = {
        'event': event,
        'data': data,
    }

    return _to_text(json.dumps(ret))


def reply_error(reason, nonce='', type=''):
    err = {
        'reason': reason,
        'type': type,
    }

    ret = {
        'nonce': nonce,
        'success': False,
        'error': err,
    }

    return _to_text(json.dumps(ret))


def event_error(reason, type=''):
    ret = {
        'event': 'error',
        'data': {
            'reason': reason,
            'type': type,
        }
    }

    return _to_text(json.dumps(ret))


def reset_room_data(room_data):
    for player in room_data['players']:
        player['ready'] = False

    new_room_data_ = new_room_data(
        room_id=room_data['room_id'],
        player_number=room_data['options']['player_number'],
    )

    new_room_data_['players'] = room_data['players']

    return new_room_data_


def new_room_data(**kwargs):
    new_room_data = {
        'room_id': kwargs['room_id'],
        'is_playing': False,
        'players': [],
        'options': {
            'player_number': kwargs['player_number'],
        },
        'state': {
            'round': 0,
            'turn': 0,
            'president': '',
            'friend': '',
            'bid_score': 0,
            'current_bid': {
                'bidder': '',
                'score': 0,
                'giruda': '',
            },
            'giruda': '',
            'joker_call': False,
            'joker_suit': '',
            'table_cards': [],
            'floor_cards': [],
        },
    }

    return new_room_data


def new_player_data(**kwargs):
    player_data = {
        'username': kwargs['username'],
        'reply': kwargs['reply'],
        'ready': kwargs['ready'],
        'cards': [],
    }

    return player_data
