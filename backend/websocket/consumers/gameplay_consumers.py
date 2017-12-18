from channels import Channel, Group
from .card import shuffled_card, hand_score, is_valid_card, card_in, is_same_card
from .card import is_mighty, is_joker_call, card_index, win_card, suit_count
from .card import filter_score_card, card_score
from .consumer_utils import event, reply_error, response, reset_room_data
from django.core.cache import cache
from .state import RoomState
from api.models import User, GameHistory
from random import shuffle


def restart_room(room_id):
    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)
        if room is None:
            return
        room = reset_room_data(room)
        cache.set('room:' + room_id, room)


def build_ai_message(ai, ret):
    ret['ai'] = True
    ret['username'] = ai['username']
    ret['reply'] = ai['reply']
    ret['nonce'] = ''


def gameplay_ai_consumer(message):
    pass


def gameplay_start_consumer(message):
    data = message.content
    room_id = data['room_id']

    with cache.lock('lock:room:' + room_id):
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
        room['game']['player_number'] = room['options']['player_number']

        cache.set('room:' + room_id, room)

        # send bidding event
        event_data = {
            'player': room['players'][0]['username']
        }
        Group(room_id).send(event('gameplay-bidding', event_data))

        # AI
        if room['players'][0]['ai'] is True:
            ai = room['players'][0]
            ret = ai.bid(room)
            build_ai_message(ai, ret)
            ret['room_id'] = room_id
            if 'bid' in ret:
                Channel('gameplay-bid').send(ret)
            else:
                # TODO: deal miss
                pass


def gameplay_bid_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    ai = data.get('ai', False)
    if not ai:
        with cache.lock('lock:player-room:' + username):
            room_id = cache.get('player-room:' + username)

        if room_id is None:
            reply_channel.send(reply_error(
                'You are not in room',
                nonce=nonce,
                type='gameplay-bid',
            ))
            return
    else:
        room_id = data['room_id']

    score = data.get('score', None)
    giruda = data.get('giruda', None)
    try_bid = data.get('bid', None)

    if try_bid is None:
        invalid_request = True
    else:
        if try_bid:
            invalid_request = score is None or giruda is None
        else:
            invalid_request = False

    if invalid_request:
        reply_channel.send(reply_error(
            'Invalid request',
            nonce=nonce,
            type='gameplay-bid',
        ))
        return

    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)
        turn = room['game']['turn']

        player_number = room['game']['player_number']

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

        else:
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

            tuned_score = score if giruda != 'N' else score + 1

            if tuned_score < miminum_bid or score > 20:
                reply_channel.send(reply_error(
                    'Invalid score',
                    nonce=nonce,
                    type='gameplay-bid',
                ))
                return

            current_bid = room['game']['current_bid']
            tuned_current_bid = current_bid['score'] if current_bid['giruda'] != 'N' else current_bid['score'] + 1

            if tuned_current_bid >= tuned_score:
                reply_channel.send(reply_error(
                    'Not enough score',
                    nonce=nonce,
                    type='gameplay-bid',
                ))
                return

            room['game']['current_bid']['bidder'] = username
            room['game']['current_bid']['score'] = score
            room['game']['current_bid']['giruda'] = giruda
            room['players'][turn]['bid'] = 1

            if score == 20:
                for player in room['players']:
                    if player['username'] != username:
                        player['bid'] = 2

        bidder_count = 0
        giveup_count = 0
        bidder = ''
        bidder_turn = 0
        bidder_reply = ''
        for i, player in enumerate(room['players']):
            if player['bid'] == 1:
                bidder_count += 1
                bidder = player['username']
                bidder_turn = i
                bidder_reply = player['reply']
            elif player['bid'] == 2:
                giveup_count += 1

        if giveup_count == player_number:
            Channel('gameplay-deal-miss').send({'all_pass': True, 'room_id': room_id})
            return
        if bidder_count == 1 and giveup_count == (player_number - 1):
            reply_channel.send(response(
                {},
                nonce=nonce,
            ))
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

                room['players'][0]['cards'] += room['game']['floor_cards']

                event_data = {
                    'floor_cards': room['game']['floor_cards'],
                }
                reply_channel.send(event(
                    'gameplay-floor-cards',
                    event_data,
                ))
                event_data = {
                    'player': bidder,
                }
                Group(room_id).send(event(
                    'gameplay-friend-selecting',
                    event_data,
                ))
                # AI
                if room['players'][0]['ai'] is True:
                    ai = room['players'][0]
                    ret = ai.friend_select(room)
                    build_ai_message(ai, ret)
                    ret['room_id'] = room_id
                    Channel('gameplay-friend-select').send(ret)

                room['game']['floor_cards'] = []
            elif player_number == 6:
                room['game']['state'] = RoomState.KILL_SELECTING
                event_data = {
                    'player': bidder,
                }
                Group(room_id).send(event(
                    'gameplay-killing',
                    event_data,
                ))
                # AI
                if room['players'][0]['ai'] is True:
                    ai = room['players'][0]
                    ret = ai.kill(room)
                    build_ai_message(ai, ret)
                    ret['room_id'] = room_id
                    Channel('gameplay-kill').send(ret)

            cache.set('room:' + room_id, room)
            return

    for i in range(turn + 1, turn + player_number):
        j = i % player_number
        player = room['players'][j]
        if player['bid'] != 2:
            room['game']['turn'] = j
            turn = j
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
    if room['players'][turn]['ai'] is True:
        ai = room['players'][turn]
        ret = ai.bid(room)
        build_ai_message(ai, ret)
        ret['room_id'] = room_id
        if 'bid' in ret:
            Channel('gameplay-bid').send(ret)
        else:
            # TODO: deal miss
            pass


def gameplay_deal_miss_consumer(message):
    data = message.content
    all_pass = data.get('all_pass', False)
    if all_pass:
        room_id = data['room_id']
        event_data = {
            'all_pass': True,
        }

        Group(room_id).send(event(
            'gameplay-deal-miss',
            event_data,
        ))
        restart_room(room_id)
        Group(room_id).send(event('gameplay-restart', {}))
        Channel('gameplay-start').send({'room_id': room_id})
        return

    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    ai = data.get('ai', False)
    if not ai:
        with cache.lock('lock:player-room:' + username):
            room_id = cache.get('player-room:' + username)

        if room_id is None:
            reply_channel.send(reply_error(
                'You are not in room',
                nonce=nonce,
                type='gameplay-deal-miss',
            ))
            return
    else:
        room_id = data['room_id']

    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)

        if room['game']['state'].value > RoomState.FRIEND_SELECTING.value:
            reply_channel.send(reply_error(
                'Invalid request',
                nonce=nonce,
                type='gameplay-deal-miss',
            ))
            return

        cards = []

        for player in room['players']:
            if player['username'] == username:
                cards = player['cards']
                giruda = room['game']['giruda']
                if giruda == '':
                    giruda = 'N'
                score = hand_score(cards, giruda)
                break

    if score > 0:
        reply_channel.send(reply_error(
            'Invalid score',
            nonce=nonce,
            type='gameplay-deal-miss',
        ))
        return

    event_data = {
        'player': username,
        'cards': cards,
        'all_pass': False,
    }

    Group(room_id).send(event(
        'gameplay-deal-miss',
        event_data,
    ))

    restart_room(room_id)
    Group(room_id).send(event('room-start', {}))
    Channel('gameplay-start').send({'room_id': room_id})


def gameplay_kill_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    ai = data.get('ai', False)
    if not ai:
        with cache.lock('lock:player-room' + username):
            room_id = cache.get('player-room:' + username)

        if room_id is None:
            reply_channel.send(reply_error(
                'You are not in room',
                nonce=nonce,
                type='gameplay-kill',
            ))
            return
    else:
        room_id = data['room_id']

    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)

        if room['game']['state'] is not RoomState.KILL_SELECTING:
            reply_channel.send(reply_error(
                'Invalid request',
                nonce=nonce,
                type='gameplay-kill',
            ))
            return

        if room['game']['president'] != username:
            reply_channel.send(reply_error(
                'You are not a president',
                nonce=nonce,
                type='gameplay-kill',
            ))
            return

        kill_card = data.get('card', None)

        if kill_card is None:
            reply_channel.send(reply_error(
                'No card',
                nonce=nonce,
                type='gameplay-kill',
            ))
            return

        if not is_valid_card(kill_card):
            reply_channel.send(reply_error(
                'Invalid card type',
                nonce=nonce,
                type='gameplay-kill',
            ))
            return

        floor_cards = room['game']['floor_cards']
        killed = False
        for i, player in enumerate(room['players']):
            if killed:
                break
            if player['username'] == username:
                if card_in(kill_card, player['cards']):
                    reply_channel.send(reply_error(
                        'You cannot kill yourself',
                        nonce=nonce,
                        type='gameplay-kill',
                    ))
                    return

                if card_in(kill_card, floor_cards):
                    # President kill
                    room['game']['killed_player'] = player
                    killed_card = room['players'][i]['cards'] + room['game']['floor_cards']
                    room['players'][i]['cards'] = []
                    del room['players'][i]

                    event_data = {
                        'player': player['username'],
                        'card': kill_card,
                    }

                    Group(room_id).send(event(
                        'gameplay-kill',
                        event_data,
                    ))

                    shuffle(killed_card)
                    for p in room['players']:
                        event_data = {
                            'cards': killed_card[:2],
                        }
                        p['cards'] += killed_card[:2]
                        p['bid'] = 0
                        Channel(p['reply']).send(event(
                            'gameplay-kill-deal',
                            event_data,
                        ))
                        del killed_card[:2]

                    room['game']['state'] = RoomState.BIDDING
                    room['game']['turn'] = 0
                    room['game']['player_number'] = 5
                    room['game']['president'] = ''
                    room['game']['bid_score'] = 0
                    room['game']['giruda'] = ''
                    room['game']['floor_cards'] = killed_card
                    room['game']['current_bid'] = {
                        'bidder': '',
                        'score': 0,
                        'giruda': '',
                    }

                    cache.set('room:' + room_id, room)
                    # send bidding event
                    event_data = {
                        'player': {
                            'username': room['players'][0]['username'],
                        }
                    }
                    Group(room_id).send(event('gameplay-bidding', event_data))
                    # AI
                    if room['players'][0]['ai'] is True:
                        ai = room['players'][0]
                        ret = ai.bid(room)
                        build_ai_message(ai, ret)
                        ret['room_id'] = room_id
                        if 'bid' in ret:
                            Channel('gameplay-bid').send(ret)
                        else:
                            pass
                    return

            elif card_in(kill_card, player['cards']):
                room['game']['killed_player'] = player
                killed_card = room['players'][i]['cards'] + floor_cards
                del room['players'][i]
                killed = True

                event_data = {
                    'player': player['username'],
                    'card': kill_card,
                }

                Group(room_id).send(event(
                    'gameplay-kill',
                    event_data,
                ))

                shuffle(killed_card)
                for i, p in enumerate(room['players']):
                    if p['username'] != username:
                        event_data = {
                            'cards': killed_card[:2],
                        }
                        room['players'][i]['cards'] += killed_card[:2]
                        del killed_card[:2]
                    else:
                        event_data = {
                            'cards': killed_card[:5],
                        }
                        room['players'][i]['cards'] += killed_card[:5]
                        del killed_card[:5]
                    Channel(p['reply']).send(event(
                        'gameplay-kill-deal',
                        event_data,
                    ))

                room['game']['state'] = RoomState.FRIEND_SELECTING
                room['game']['floor_cards'] = []
                room['game']['player_number'] = 5
                room['game']['turn'] = 0
                cache.set('room:' + room_id, room)
            event_data = {
                'player': username,
            }
            Group(room_id).send(event(
                'gameplay-friend-selecting',
                event_data,
            ))


def gameplay_friend_select_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    ai = data.get('ai', False)
    if not ai:
        with cache.lock('lock:player-room:' + username):
            room_id = cache.get('player-room:' + username)

        if room_id is None:
            reply_channel.send(reply_error(
                'You are not in room',
                nonce=nonce,
                type='gameplay-friend-select',
            ))
            return
    else:
        room_id = data['room_id']

    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)

        if room['game']['state'] is not RoomState.FRIEND_SELECTING:
            reply_channel.send(reply_error(
                'Invalid request',
                nonce=nonce,
                type='gameplay-friend-select',
            ))
            return

        if room['game']['president'] != username:
            reply_channel.send(reply_error(
                'You are not president',
                nonce=nonce,
                type='gameplay-friend-select',
            ))
            return

        floor_cards = data.get('floor_cards', None)

        if floor_cards is None or not isinstance(floor_cards, list) or len(floor_cards) != 3:
            reply_channel.send(reply_error(
                'Invalid floor cards',
                nonce=nonce,
                type='gameplay-friend-select',
            ))
            return

        player_card = []
        room['floor_cards'] = []
        for p in room['players']:
            if p['username'] == username:
                bidder = p
                player_card = p['cards']
                break

        for c in floor_cards:
            ci = card_index(c, player_card)
            if ci == -1:
                reply_channel.send(reply_error(
                    'Invalid floor cards',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return
            room['floor_cards'].append(c)
            bidder['score'] += card_score(c)
            del player_card[ci]

        type = data.get('type', None)

        if type is None or type not in ['no', 'card', 'player', 'round']:
            reply_channel.send(reply_error(
                'Invalid friend type',
                nonce=nonce,
                type='gameplay-friend-select',
            ))
            return

        event_data = {
            'type': type,
        }

        if type == 'no':
            pass

        elif type == 'card':
            card = data.get('card', None)
            if card is None or not is_valid_card(card):
                reply_channel.send(reply_error(
                    'Invalid card',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return

            # if card_in(card, player_card):
            #     reply_channel.send(reply_error(
            #         'You cannot select your card',
            #         nonce=nonce,
            #         type='gameplay-friend-select',
            #     ))
            #     return

            room['game']['friend_selection']['type'] = 'card'
            room['game']['friend_selection']['card'] = card
            event_data['card'] = card

        elif type == 'player':
            p = data.get('player', None)
            if p is None or not isinstance(p, str):
                reply_channel.send(reply_error(
                    'Invalid player',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return

            found = False
            for player in room['players']:
                if player['username'] == p:
                    found = True
                    room['game']['friend_selection']['type'] = 'player'
                    room['game']['friend_selection']['player'] = p
                    event_data['player'] = p
                    break

            if not found:
                reply_channel.send(reply_error(
                    'Invalid player',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return

        elif type == 'round':
            t = data.get('round', None)
            if t is None or not isinstance(t, int) or t < 1 or t > 10:
                reply_channel.send(reply_error(
                    'Invalid turn',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return

            room['game']['friend_selection']['type'] = 'round'
            room['game']['friend_selection']['round'] = t
            event_data['round'] = t

        change_bid = data.get('change_bid', None)

        if change_bid is not None and isinstance(change_bid, dict):
            bid = change_bid.get('score', None)
            giruda = change_bid.get('giruda', None)
            if bid is None or giruda is None:
                reply_channel.send(reply_error(
                    'Invalid bid or giruda change',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return
            current_bid = room['game']['bid_score']
            current_giruda = room['game']['giruda']
            change_score = bid if giruda != 'N' else bid - 1
            current_score = current_bid if current_giruda != 'N' else current_bid - 1

            if change_score < current_score + 2:
                reply_channel.send(reply_error(
                    'Not enough bid',
                    nonce=nonce,
                    type='gameplay-friend-select',
                ))
                return

            room['game']['bid_score'] = bid
            room['game']['giruda'] = giruda
            event_data['change_bid'] = change_bid

        room['game']['state'] = RoomState.PLAYING
        room['game']['turn'] = 0
        room['game']['round'] = 1

        reply_channel.send(response(
            {},
            nonce=nonce,
        ))
        Group(room_id).send(event(
            'gameplay-friend-select',
            event_data,
        ))

        if room['game']['friend_selection']['type'] == 'player':
            room['game']['friend'] = room['game']['friend_selection']['player']
            Group(room_id).send(event(
                'gameplay-friend-revealed',
                {'player': room['game']['friend']},
            ))

        cache.set('room:' + room_id, room)

    event_data = {
        'player': username,
    }

    Group(room_id).send(event(
        'gameplay-turn',
        event_data,
    ))
    if room['players'][0]['ai'] is True:
        ai = room['players'][0]
        ret = ai.play(room)
        build_ai_message(ai, ret)
        ret['room_id'] = room_id
        Channel('gameplay-play').send(ret)


def gameplay_play_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    ai = data.get('ai', False)
    if not ai:
        with cache.lock('lock:player-room:' + username):
            room_id = cache.get('player-room:' + username)

        if room_id is None:
            reply_channel.send(reply_error(
                'You are not in room',
                nonce=nonce,
                type='gameplay-play',
            ))
            return
    else:
        room_id = data['room_id']

    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)

        if room['game']['state'] != RoomState.PLAYING:
            reply_channel.send(reply_error(
                'Invalid request',
                nonce=nonce,
                type='gameplay-play',
            ))
            return

        turn = room['game']['turn']

        if room['players'][turn]['username'] != username:
            reply_channel.send(reply_error(
                'Not your turn',
                nonce=nonce,
                type='gameplay-play',
            ))
            return

        # card validation from here

        player_card = room['players'][turn]['cards']
        card = data.get('card', None)
        round = room['game']['round']

        if card is None or not is_valid_card(card) or not card_in(card, player_card):
            reply_channel.send(reply_error(
                'Invalid card',
                nonce=nonce,
                type='gameplay-play',
            ))
            return

        giruda = room['game']['giruda']
        event_data = {
            'player': username,
            'gan': False,
        }

        is_joker_in = card_in({'rank': 'JK', 'suit': None}, player_card)

        # first round exceptions
        if round == 1:
            if turn == 0 and card['suit'] == giruda:
                giruda_count = suit_count(player_card, giruda)
                if giruda_count != 10:
                    reply_channel.send(reply_error(
                        'You cannot play giruda at first round, first turn',
                        nonce=nonce,
                        type='gameplay-play',
                    ))
                    return

        # 9th round joker behaviour
        if is_joker_in and round == 9:
            if card['rank'] != 'JK':
                reply_channel.send(reply_error(
                    'You should play joker at 9th turn',
                    nonce=nonce,
                    type='gameplay-play',
                ))
                return

        if turn == 0:
            # joker
            if card['rank'] == 'JK':
                joker_suit = data.get('joker_suit', None)
                if joker_suit is None:
                    reply_channel.send(reply_error(
                        'No joker suit',
                        nonce=nonce,
                        type='gameplay-play',
                    ))
                    return

                card['suit'] = joker_suit
            # joker-call
            elif is_joker_call(card, giruda):
                joker_call = data.get('joker_call', False)
                if joker_call and round != 1 and round != 10:
                    room['game']['joker_call'] = True
                elif joker_call and (round == 1 or round == 10):
                    reply_channel.send(reply_error(
                        'You cannot call joker at first or last round',
                        nonce=nonce,
                        type='gameplay-play',
                    ))
                    return
                event_data['joker_call'] = joker_call
        else:
            joker_call = room['game']['joker_call']
            if joker_call and is_joker_in:
                if card['rank'] != 'JK' and not is_mighty(card, giruda):
                    reply_channel.send(reply_error(
                        'You should play joker or mighty when called',
                        nonce=nonce,
                        type='gameplay-play',
                    ))
                    return

            if card['rank'] != 'JK' and not is_mighty(card, giruda):
                table_suit = room['game']['table_cards'][0]['suit']
                if table_suit != card['suit']:
                    found = False
                    for c in player_card:
                        if c['suit'] == table_suit:
                            found = True
                            break
                    if found:
                        reply_channel.send(reply_error(
                            'You should play current table suit',
                            nonce=nonce,
                            type='gameplay-play',
                        ))
                        return
                    if card['suit'] == giruda:
                        event_data['gan'] = True
            elif card['rank'] == 'JK':
                card['suit'] = None

        # valiation done
        ci = card_index(card, player_card)
        del player_card[ci]

        room['game']['table_cards'].append(card)
        room['game']['card_history'].append(card)
        room['players'][turn]['cards'] = player_card

        event_data['card'] = card

        reply_channel.send(response(
            {},
            nonce=nonce,
        ))

        Group(room_id).send(event(
            'gameplay-play',
            event_data,
        ))

        friend_selection = room['game']['friend_selection']
        if friend_selection['type'] == 'card':
            friend_card = friend_selection['card']
            if is_same_card(friend_card, card):
                room['game']['friend'] = username
                event_data = {
                    'player': username,
                }
                Group(room_id).send(event(
                    'gameplay-friend-revealed',
                    event_data,
                ))

        turn += 1

        if turn == room['game']['player_number']:
            # round end
            turn = 0
            win = win_card(
                room['game']['table_cards'],
                room['game']['giruda'],
                room['game']['joker_call'],
                round=round,
            )

            win_player = room['players'][win]['username']
            score_cards = filter_score_card(room['game']['table_cards'])
            room['players'][win]['score'] += len(score_cards)

            f = room['game']['friend_selection']
            if f['type'] == 'round' and f['round'] == round:
                room['game']['friend'] = win_player
                event_data = {
                    'player': win_player,
                }
                Group(room_id).send(event(
                    'gameplay-friend-revealed',
                    event_data,
                ))

            event_data = {
                'player': win_player,
                'score_cards': score_cards,
            }
            Group(room_id).send(event(
                'gameplay-round-end',
                event_data,
            ))
            room['players'] = room['players'][win:] + room['players'][:win]
            room['game']['round'] += 1

            if room['game']['round'] == 11:
                # room cache set
                scores = {}
                fi, pi = -1, -1
                total_score = 0
                if room['game']['president'] == room['game']['friend']:
                    room['game']['friend'] = ''
                president_user, friend_user = None, None
                for i, player in enumerate(room['players']):
                    scores[player['username']] = player['score']
                    if player['username'] == room['game']['president']:
                        pi = i
                        total_score += player['score']
                        president_user = User.objects.get(username=player['username'])
                    elif player['username'] == room['game']['friend']:
                        fi = i
                        total_score += player['score']
                        friend_user = User.objects.get(username=player['username'])
                if fi == -1:
                    fi = pi
                event_data = {
                    'scores': scores,
                    'president': room['game']['president'],
                    'friend': room['game']['friend'],
                    'bid': room['game']['bid_score'],
                    'giruda': room['game']['giruda'],
                }

                history = GameHistory(
                    president=president_user,
                    friend=friend_user,
                    bid=room['game']['bid_score'],
                    giruda=room['game']['giruda'],
                    score=total_score,
                )
                history.save()

                president_win = total_score >= room['game']['bid_score']
                players, win_players, lose_players = [], [], []
                for p in room['players']:
                    if p['username'] == room['game']['president']:
                        players.append(president_user)
                        if president_win:
                            win_players.append(president_user)
                        else:
                            lose_players.append(president_user)
                    elif p['username'] == room['game']['friend']:
                        players.append(friend_user)
                        if president_win:
                            win_players.append(friend_user)
                        else:
                            lose_players.append(friend_user)
                    else:
                        player = User.objects.get(username=p['username'])
                        players.append(player)
                        if president_win:
                            lose_players.append(player)
                        else:
                            win_players.append(player)
                history.players.add(*players)
                history.win_players.add(*win_players)
                history.lose_players.add(*lose_players)

                room = reset_room_data(room)
                room['game']['state'] = RoomState.RESULT
                room['players'] = room['players'][fi:] + room['players'][:fi]
                # TODO: restore killed player
                cache.set('room:' + room_id, room)
                Group(room_id).send(event(
                    'gameplay-game-end',
                    event_data,
                ))
                return

            room['game']['table_cards'] = []
            room['game']['joker_call'] = False
            room['game']['joker_suit'] = ''

        room['game']['turn'] = turn
        cache.set('room:' + room_id, room)

    Group(room_id).send(event(
        'gameplay-turn',
        {'player': room['players'][turn]['username']},
    ))
    if room['players'][turn]['ai'] is True:
        ai = room['players'][turn]
        ret = ai.play(room)
        build_ai_message(ai, ret)
        ret['room_id'] = room_id
        Channel('gameplay-play').send(ret)


def gameplay_continue_consumer(message):
    data = message.content
    username = data['username']
    nonce = data['nonce']
    reply_channel = Channel(data['reply'])
    ai = data.get('ai', False)
    if not ai:
        with cache.lock('lock:player-room:' + username):
            room_id = cache.get('player-room:' + username)

        if room_id is None:
            reply_channel.send(reply_error(
                'You are not in room',
                nonce=nonce,
                type='gameplay-continue',
            ))
            return
    else:
        room_id = data['room_id']

    cont = data.get('continue', None)
    if cont is None:
        reply_channel.send(reply_error(
            'Continue is required',
            nonce=nonce,
            type='gameplay-continue',
        ))
        return

    if cont is False:
        reply_channel.send(response(
            {},
            nonce=nonce,
        ))
        return

    with cache.lock('lock:room:' + room_id):
        room = cache.get('room:' + room_id)
        continue_count = 0
        for player in room['players']:
            if player['username'] == username:
                if player['continue'] is True:
                    reply_channel.send(reply_error(
                        'You already continued',
                        nonce=nonce,
                        type='gameplay-continue',
                    ))
                    return
                player['continue'] = True
            if player['continue'] is True:
                continue_count += 1

        reply_channel.send(response(
            {},
            nonce=nonce,
        ))
        cache.set('room:' + room_id, room)

        if continue_count < room['options']['player_number']:
            return
    Group(room_id).send(event('gameplay-continue', {}))
    restart_room(room_id)
    Group(room_id).send(event('gameplay-restart', {}))
    Channel('gameplay-start').send({'room_id': room_id})
