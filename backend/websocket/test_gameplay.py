from django.test import TestCase
from channels.test import ChannelTestCase, Client
from django.core.cache import cache
from websocket.consumers.card import win_card, code_to_card
from websocket.consumers.consumer_utils import new_room_data, new_player_data
from websocket.consumers.state import RoomState


class GameplayTest(ChannelTestCase):
    def setUp(self):
        cache.clear()
        self.clients = []
        room = new_room_data(
            room_id='test',
            player_number=5,
        )

        for i in range(5):
            client = Client()
            username = 'doge{}'.format(i)
            player_data = new_player_data(
                username=username,
                reply=client.reply_channel,
                ready=True,
            )
            room['players'].append(player_data)
            cache.set('player-room:' + username, 'test')
            self.clients.append(client)
        room['game']['state'] = RoomState.BIDDING
        cache.set('room:test', room)

    def receive_until_none(self, client):
        while True:
            res = client.receive()
            if res is None:
                break

    def flush_all(self):
        for client in self.clients:
            self.receive_until_none(client)

    def floor_card(self, cards):
        new_cards = []
        for card in cards:
            new_cards.append(code_to_card(card))
        room = cache.get('room:test')
        room['game']['floor_cards'] = new_cards
        cache.set('room:test', room)

    def deal(self, username, cards):
        new_cards = []
        for card in cards:
            new_cards.append(code_to_card(card))
        room = cache.get('room:test')
        for i, player in enumerate(room['players']):
            if player['username'] == username:
                room['players'][i]['cards'] = new_cards
                break
        cache.set('room:test', room)

    def bid(self, username, score, giruda, try_bid):
        index = int(username[-1])
        client = self.clients[index]
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
            'score': score,
            'giruda': giruda,
            'bid': try_bid,
        }
        client.send_and_consume('gameplay-bid', content)
        self.flush_all()

    def kill(self, username, kill_card):
        index = int(username[-1])
        client = self.clients[index]
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
            'card': code_to_card(kill_card),
        }
        client.send_and_consume('gameplay-kill', content)
        self.flush_all()

    def friend_select(self, username, data):
        index = int(username[-1])
        client = self.clients[index]
        new_cards = []
        for card in data['floor_cards']:
            new_cards.append(code_to_card(card))
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
            'type': data['type'],
            'card': code_to_card(data.get('card', None)),
            'player': data.get('player', None),
            'round': data.get('round', None),
            'floor-cards': new_cards,
        }
        client.send_and_consume('gameplay-friend-select', content)
        self.flush_all()

    def play(self, username, card, joker_call=None, joker_suit=None):
        card = code_to_card(card)
        index = int(username[-1])
        client = self.clients[index]
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
            'card': card,
        }
        if joker_call:
            content['joker-call'] = joker_call
        if joker_suit:
            content['joker-suit'] = joker_suit
        client.send_and_consume('gameplay-play', content)
        self.flush_all()

    def test_record_one(self):
        self.floor_card(['SJ', 'C9', 'JK'])
        self.deal('doge0', ['SA', 'SQ', 'S2', 'HJ', 'D6', 'DK', 'C10', 'D7', 'C7', 'D4'])
        self.deal('doge1', ['SK', 'S8', 'H3', 'C4', 'H10', 'D8', 'S5', 'HK', 'C6', 'HQ'])
        self.deal('doge2', ['CQ', 'H8', 'S7', 'S3', 'HA', 'CA', 'S10', 'D9', 'DQ', 'S4'])
        self.deal('doge3', ['C2', 'H5', 'S9', 'DJ', 'H9', 'C8', 'D2', 'C5', 'DA', 'H4'])
        self.deal('doge4', ['H2', 'H7', 'D3', 'CJ', 'CK', 'D10', 'H6', 'S6', 'C3', 'D5'])
        self.bid('doge0', 13, 'S', True)
        self.bid('doge1', 0, '', False)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.BIDDING)
        self.bid('doge2', 0, '', False)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.FRIEND_SELECTING)
        self.friend_select(
            'doge0',
            {
                'type': 'card',
                'card': 'DA',
                'floor_cards': ['HJ', 'C10', 'C7'],
            }
        )
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.PLAYING)
        # round 1
        self.play('doge0', 'DK')
        self.play('doge1', 'D8')
        self.play('doge2', 'D9')
        self.play('doge3', 'DJ')
        self.play('doge4', 'D3')
        # round 2
        self.play('doge0', 'SA')
        self.play('doge1', 'S5')
        self.play('doge2', 'S3')
        self.play('doge3', 'S9')
        self.play('doge4', 'S6')
        # round 3
        self.play('doge0', 'JK', joker_suit='S')
        self.play('doge1', 'S8')
        self.play('doge2', 'S7')
        self.play('doge3', 'C2')
        self.play('doge4', 'C3')
        # round 4
        self.play('doge0', 'S2')
        self.play('doge1', 'SK')
        self.play('doge2', 'S4')
        self.play('doge3', 'DA')
        self.play('doge4', 'H2')
        # round 5
        self.play('doge3', 'D2')
        self.play('doge4', 'D10')
        self.play('doge0', 'D4')
        self.play('doge1', 'H10')
        self.play('doge2', 'DQ')
        # round 6
        self.play('doge2', 'CA')
        self.play('doge3', 'C5')
        self.play('doge4', 'CJ')
        self.play('doge0', 'C9')
        self.play('doge1', 'C4')
        # round 7
        self.play('doge2', 'HA')
        self.play('doge3', 'H4')
        self.play('doge4', 'H6')
        self.play('doge0', 'SJ')
        self.play('doge1', 'H3')
        # round 8
        self.play('doge0', 'SQ')
        self.play('doge1', 'C6')
        self.play('doge2', 'S10')
        self.play('doge3', 'H5')
        self.play('doge4', 'H7')
        # round 9
        self.play('doge0', 'D7')
        self.play('doge1', 'HQ')
        self.play('doge2', 'H8')
        self.play('doge3', 'H9')
        self.play('doge4', 'D5')
        # final round
        self.play('doge0', 'D6')
        self.play('doge1', 'HK')
        self.play('doge2', 'CQ')
        self.play('doge3', 'C8')
        self.play('doge4', 'CK')
        ###


class CardTest(TestCase):
    def test_win_table_suit(self):
        cards = [
            {'rank': 'K', 'suit': 'D'},
            {'rank': '2', 'suit': 'D'},
            {'rank': 'A', 'suit': 'D'},
            {'rank': 'J', 'suit': 'D'},
            {'rank': 'Q', 'suit': 'D'},
        ]

        win = win_card(cards, 'N', False)
        self.assertEqual(win, 2)
        win = win_card(cards, 'C', False)
        self.assertEqual(win, 2)

    def test_win_giruda(self):
        cards = [
            {'rank': 'K', 'suit': 'D'},
            {'rank': 'A', 'suit': 'D'},
            {'rank': '2', 'suit': 'C'},
            {'rank': 'J', 'suit': 'C'},
            {'rank': 'Q', 'suit': 'D'},
        ]

        win = win_card(cards, 'C', False)
        self.assertEqual(win, 3)

    def test_win_mighty(self):
        cards = [
            {'rank': 'JK', 'suit': 'S'},
            {'rank': 'A', 'suit': 'S'},
            {'rank': 'A', 'suit': 'C'},
            {'rank': 'A', 'suit': 'D'},
            {'rank': 'K', 'suit': 'S'},
        ]

        win = win_card(cards, 'C', False)
        self.assertEqual(win, 1)
        win = win_card(cards, 'S', False)
        self.assertEqual(win, 3)

    def test_win_joker(self):
        cards = [
            {'rank': 'A', 'suit': 'H'},
            {'rank': 'A', 'suit': 'D'},
            {'rank': 'A', 'suit': 'C'},
            {'rank': 'JK', 'suit': None},
            {'rank': 'K', 'suit': 'S'},
        ]

        win = win_card(cards, 'C', False)
        self.assertEqual(win, 3)

    def test_win_joker_call(self):
        cards = [
            {'rank': '3', 'suit': 'C'},
            {'rank': '2', 'suit': 'D'},
            {'rank': 'A', 'suit': 'C'},
            {'rank': 'JK', 'suit': None},
            {'rank': 'K', 'suit': 'C'},
        ]

        win = win_card(cards, 'H', True)
        self.assertEqual(win, 2)

    def test_win_first_turn_joker(self):
        cards = [
            {'rank': '3', 'suit': 'C'},
            {'rank': '2', 'suit': 'D'},
            {'rank': 'A', 'suit': 'C'},
            {'rank': 'JK', 'suit': None},
            {'rank': 'K', 'suit': 'C'},
        ]

        win = win_card(cards, 'H', False, round=1)
        self.assertEqual(win, 2)
