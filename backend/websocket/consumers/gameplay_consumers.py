from channels import Channel, Group
from .card import shuffled_card
from .consumer_utils import event
from django.core.cache import cache


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

    room['state']['floor_cards'] = cards

    cache.set('room:' + room_id, room)

    # send bidding event
    event_data = {
        'player': {
            'username': room['players'][0]['username'],
        }
    }
    Group(room_id).send(event('gameplay-bidding', event_data))


def gameplay_bid_consumer(message):
    pass


def gameplay_deal_miss_consumer(message):
    pass


def gameplay_friend_select_consumer(message):
    pass


def gameplay_play_consumer(message):
    pass
