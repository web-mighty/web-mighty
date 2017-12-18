from django.test import TestCase, override_settings
from channels.test import ChannelTestCase, Client
from django.core.cache import cache
from websocket.consumers.card import win_card, code_to_card
from websocket.consumers.card import boss_card
from websocket.consumers.consumer_utils import new_room_data, new_player_data
from websocket.consumers.state import RoomState
from websocket.consumers.ai import AI
from api.models import User, GameHistory, create_user
import os


@override_settings(USE_DELAY=False)
class AITest(TestCase):
    def setUp(self):
        self.mock_room = new_room_data(
            room_id='test',
            player_number=5,
        )

    def code_to_card_bulk(self, cards):
        new_cards = []
        for card in cards:
            new_cards.append(code_to_card(card))
        return new_cards

    def test_initialize(self):
        ai = AI(0)
        self.assertTrue(ai['ai'])
        self.assertEqual(ai['username'], '*AI-doge')
        self.assertEqual(ai['reply'], 'gameplay-ai')
        self.assertTrue(ai['ready'])
        self.assertTrue(ai['continue'])

    def test_bid(self):
        ai = AI(0)
        card_codes = ['SA', 'SK', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'C2', 'C3', 'C4']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        ret = ai.bid(self.mock_room)
        self.assertTrue(ret['bid'])
        self.assertEqual(ret['score'], 13)
        self.assertEqual(ret['giruda'], 'S')

        self.mock_room['game']['current_bid']['score'] = 16
        ret = ai.bid(self.mock_room)
        self.assertTrue(ret['bid'])
        self.assertEqual(ret['score'], 17)
        self.assertEqual(ret['giruda'], 'S')

        self.mock_room['game']['current_bid']['score'] = 17
        ret = ai.bid(self.mock_room)
        self.assertFalse(ret['bid'])

    def test_kill(self):
        ai = AI(0)
        card_codes = ['SA', 'SK', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'C2', 'C3', 'C4']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        self.mock_room['game']['current_bid']['giruda'] = 'S'
        ret = ai.kill(self.mock_room)
        self.assertEqual(ret['card']['rank'], 'JK')

        card_codes = ['SA', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'C2', 'C3', 'C4', 'C5']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        self.mock_room['game']['current_bid']['giruda'] = 'S'
        ret = ai.kill(self.mock_room)
        self.assertEqual(ret['card']['rank'], 'K')
        self.assertEqual(ret['card']['suit'], 'S')

    def test_friend_select(self):
        ai = AI(0)
        card_codes = ['SA', 'SK', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'C2', 'C3', 'C4']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        self.mock_room['game']['current_bid']['giruda'] = 'S'
        ret = ai.friend_select(self.mock_room)
        self.assertEqual(ret['card']['rank'], 'A')
        self.assertEqual(ret['card']['suit'], 'D')
        self.assertIn({'rank': '2', 'suit': 'C'}, ret['floor_cards'])
        self.assertIn({'rank': '3', 'suit': 'C'}, ret['floor_cards'])
        self.assertIn({'rank': '4', 'suit': 'C'}, ret['floor_cards'])

        card_codes = ['SA', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'C2', 'C3', 'C4', 'C5']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        self.mock_room['game']['current_bid']['giruda'] = 'S'
        ret = ai.friend_select(self.mock_room)
        self.assertEqual(ret['card']['rank'], 'A')
        self.assertEqual(ret['card']['suit'], 'D')

        card_codes = ['SA', 'SK', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'DA', 'C3', 'C4']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        self.mock_room['game']['current_bid']['giruda'] = 'S'
        ret = ai.friend_select(self.mock_room)
        self.assertEqual(ret['card']['rank'], 'JK')

        card_codes = ['SA', 'SK', 'SQ', 'SJ', 'S10', 'S9', 'S8', 'DA', 'JK', 'C4']
        ai['cards'] = self.code_to_card_bulk(card_codes)
        self.mock_room['game']['current_bid']['giruda'] = 'S'
        ret = ai.friend_select(self.mock_room)
        self.assertEqual(ret['card']['rank'], 'K')
        self.assertEqual(ret['card']['suit'], 'D')

    def test_play(self):
        ais = []
        for i in range(5):
            ai = AI(i)
            self.mock_room['players'].append(ai)
            ais.append(ai)
        self.mock_room['game']['president'] = '*AI-doge'
        self.mock_room['game']['friend'] = '*AI-gon'
        self.mock_room['game']['giruda'] = 'C'

        self.mock_room['game']['turn'] = 2
        self.mock_room['players'][1]['cards'] = [
            {'rank': 'K', 'suit': 'C'},
            {'rank': 'A', 'suit': 'S'},
            {'rank': '2', 'suit': 'H'},
            {'rank': '5', 'suit': 'C'},
        ]
        self.mock_room['game']['table_cards'] = [
            {'rank': 'A', 'suit': 'C'},
        ]

        ret = ais[1].play(self.mock_room)
        card = ret['card']
        self.assertEqual(card['rank'], '5')
        self.assertEqual(card['suit'], 'C')

        self.mock_room['players'][1]['cards'] = [
            {'rank': 'K', 'suit': 'C'},
            {'rank': 'A', 'suit': 'H'},
            {'rank': '2', 'suit': 'H'},
            {'rank': '5', 'suit': 'C'},
        ]
        self.mock_room['game']['table_cards'] = [
            {'rank': '2', 'suit': 'D'},
        ]
        ret = ais[1].play(self.mock_room)
        card = ret['card']
        self.assertEqual(card['rank'], 'K')
        self.assertEqual(card['suit'], 'C')


@override_settings(USE_DELAY=False)
class GameplayTest(ChannelTestCase):
    def setUp(self):
        cache.clear()
        self.clients = []

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)
        from django_redis import get_redis_connection
        get_redis_connection('default').flushdb()

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

    def deal_miss(self, username):
        index = int(username[-1])
        client = self.clients[index]
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
        }
        client.send_and_consume('gameplay-deal-miss', content)
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
        card = data.get('card', None)
        player = data.get('player', None)
        round = data.get('round', None)
        change_bid = data.get('change_bid', None)
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
            'type': data['type'],
            'floor_cards': new_cards,
        }
        if card is not None:
            content['card'] = code_to_card(card)
        if player is not None:
            content['player'] = player
        if round is not None:
            content['round'] = round
        if change_bid is not None:
            content['change_bid'] = change_bid
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
            content['joker_call'] = joker_call
        if joker_suit:
            content['joker_suit'] = joker_suit
        client.send_and_consume('gameplay-play', content)
        self.flush_all()

    def game_continue(self, username, cont):
        index = int(username[-1])
        client = self.clients[index]
        content = {
            'username': username,
            'nonce': username,
            'reply': client.reply_channel,
            'continue': cont,
        }
        client.send_and_consume('gameplay-continue', content)
        self.flush_all()

    def flush_ai(self):
        client = Client()
        while True:
            try:
                client.consume('gameplay-ai')
            except Exception as e:
                break

    def test_ai_play(self):
        room = new_room_data(
            room_id='test',
            player_number=5,
        )
        for i in range(5):
            nickname = ['doge', 'gon', 'eom', 'egger', 'ha']
            create_user(
                username='*AI-{}'.format(nickname[i]),
                password='doge',
                nickname='*AI-{}'.format(nickname[i]),
                email='asdf@asdf.com'
            )

        for i in range(5):
            room['players'].append(AI(i))
        room['game']['state'] = RoomState.BIDDING
        cache.set('room:test', room)

        client = Client()
        client.send_and_consume('gameplay-start', {'room_id': 'test'})
        room = cache.get('room:test')
        while room['game']['state'] is RoomState.BIDDING:
            client.consume('gameplay-bid', fail_on_none=False)
            self.flush_ai()
            room = cache.get('room:test')
        president = room['game']['president']
        client.consume('gameplay-friend-select')
        room = cache.get('room:test')
        for _ in range(50):
            client.consume('gameplay-play', fail_on_none=False)
            self.flush_ai()
            room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.RESULT)

        history = GameHistory.objects.all()[0]
        self.assertEqual(president, history.president.username)

    def test_record_one(self):
        for i in range(5):
            create_user(
                username='doge{}'.format(i),
                password='doge',
                nickname='nick{}'.format(i),
                email='asdf@asdf.com'
            )
        # set up initial room state
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
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.RESULT)
        self.assertEqual(room['players'][0]['username'], 'doge3')

        history = GameHistory.objects.get(id=1)
        self.assertEqual(history.bid, 13)
        self.assertEqual(history.giruda, 'S')
        self.assertEqual(history.president.username, 'doge0')
        self.assertEqual(history.friend.username, 'doge3')
        doge2 = User.objects.get(username='doge2')
        self.assertEqual(doge2.game_histories.all()[0], history)

        self.game_continue('doge0', True)
        self.game_continue('doge0', True)
        self.game_continue('doge1', True)
        self.game_continue('doge2', True)
        self.game_continue('doge3', True)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.RESULT)
        self.game_continue('doge4', True)
        from websocket.consumers.gameplay_consumers import gameplay_start_consumer
        message = self.get_next_message('gameplay-start')
        gameplay_start_consumer(message)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.BIDDING)

    def test_record_six_mighty(self):
        # set up initial room state
        room = new_room_data(
            room_id='test',
            player_number=6,
        )

        for i in range(6):
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

        self.floor_card(['CK', 'D10', 'H6', 'S6', 'C3'])
        self.deal('doge0', ['HA', 'SQ', 'H4', 'CQ', 'H8', 'DQ', 'D8', 'S3'])
        self.deal('doge1', ['S2', 'S7', 'C2', 'H5', 'CA', 'S10', 'HJ', 'D5'])
        self.deal('doge2', ['D6', 'DK', 'S9', 'DJ', 'S4', 'C5', 'C7', 'D4'])
        self.deal('doge3', ['C10', 'D7', 'H9', 'C8', 'DA', 'H3', 'SK', 'S8'])
        self.deal('doge4', ['SJ', 'C9', 'D2', 'S5', 'C4', 'H2', 'HQ', 'H7'])
        self.deal('doge5', ['D3', 'CJ', 'HK', 'JK', 'SA', 'C6', 'H10', 'D9'])
        self.bid('doge0', 14, 'H', True)
        self.bid('doge1', 0, '', False)
        self.bid('doge2', 15, 'D', True)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)
        self.bid('doge5', 0, '', False)
        self.bid('doge0', 0, '', False)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.KILL_SELECTING)
        # kill doge3
        self.kill('doge2', 'DA')
        room = cache.get('room:test')
        self.assertEqual(room['game']['killed_player']['username'], 'doge3')
        self.assertIs(room['game']['state'], RoomState.FRIEND_SELECTING)

        # set kill-deal to our prebuilt data
        self.deal('doge0', ['HA', 'SQ', 'H4', 'CQ', 'H8', 'DQ', 'D8', 'S3', 'H3', 'CK'])
        self.deal('doge1', ['S2', 'S7', 'C2', 'H5', 'CA', 'S10', 'HJ', 'D5', 'DA', 'C3'])
        self.deal('doge2', ['D6', 'DK', 'S9', 'DJ', 'S4', 'C5', 'C7', 'D4', 'D10, D7', 'C10', 'S6', 'C8'])
        self.deal('doge4', ['SJ', 'C9', 'D2', 'S5', 'C4', 'H2', 'HQ', 'H7', 'SK', 'H6'])
        self.deal('doge5', ['D3', 'CJ', 'HK', 'JK', 'SA', 'C6', 'H10', 'D9', 'S8', 'H9'])
        self.friend_select(
            'doge2',
            {
                'type': 'card',
                'card': 'SA',
                'floor_cards': ['S9', 'S4', 'S6'],
            }
        )
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.PLAYING)

        # round 1
        self.play('doge2', 'C10')
        self.play('doge4', 'C4')
        self.play('doge5', 'C6')
        self.play('doge0', 'CQ')
        self.play('doge1', 'CA')
        # round 2
        self.play('doge1', 'C3', joker_call=True)
        self.play('doge2', 'C8')
        self.play('doge4', 'C9')
        self.play('doge5', 'SA')
        self.play('doge0', 'CK')

    def test_six_mighty_president_kill(self):
        # set up initial room state
        room = new_room_data(
            room_id='test',
            player_number=6,
        )

        for i in range(6):
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

        self.floor_card(['CK', 'JK', 'H6', 'S6', 'C3'])
        self.deal('doge0', ['HA', 'SQ', 'H4', 'CQ', 'H8', 'DQ', 'D8', 'S3'])
        self.deal('doge1', ['S2', 'S7', 'C2', 'H5', 'CA', 'S10', 'HJ', 'D5'])
        self.deal('doge2', ['D6', 'DK', 'S9', 'DJ', 'S4', 'C5', 'C7', 'D4'])
        self.deal('doge3', ['C10', 'D7', 'H9', 'C8', 'DA', 'H3', 'SK', 'S8'])
        self.deal('doge4', ['SJ', 'C9', 'D2', 'S5', 'C4', 'H2', 'HQ', 'H7'])
        self.deal('doge5', ['D3', 'CJ', 'HK', 'D10', 'SA', 'C6', 'H10', 'D9'])
        self.bid('doge0', 14, 'H', True)
        self.bid('doge1', 0, '', False)
        self.bid('doge2', 0, '', False)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)
        self.bid('doge5', 0, '', False)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.KILL_SELECTING)
        # president kill
        self.kill('doge0', 'JK')
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.BIDDING)
        self.bid('doge1', 12, 'N', True)
        self.bid('doge2', 0, '', False)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)
        self.bid('doge5', 0, '', False)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.FRIEND_SELECTING)

    def test_full_bid(self):
        # set up initial room state
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

        self.bid('doge0', 20, 'S', True)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.FRIEND_SELECTING)
        self.assertEqual(room['game']['president'], 'doge0')

    def test_final_bid(self):
        # set up initial room state
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

        self.bid('doge0', 0, 'N', False)
        self.bid('doge1', 0, 'N', False)
        self.bid('doge2', 0, 'N', False)
        self.bid('doge3', 0, 'N', False)
        self.bid('doge4', 13, 'S', True)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.FRIEND_SELECTING)
        self.assertEqual(room['game']['president'], 'doge4')

    def test_bid_change(self):
        # set up initial room state
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

        self.deal('doge0', ['SA', 'SQ', 'S2'])
        self.bid('doge0', 13, 'S', True)
        self.bid('doge1', 0, '', False)
        self.bid('doge2', 0, '', False)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.FRIEND_SELECTING)
        self.friend_select(
            'doge0',
            {
                'type': 'round',
                'round': 1,
                'floor_cards': ['SA', 'SQ', 'S2'],
                'change_bid': {
                    'score': 15,
                    'giruda': 'H',
                },
            }
        )
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.PLAYING)
        self.assertEqual(room['game']['bid_score'], 15)
        self.assertEqual(room['game']['giruda'], 'H')

    def test_selection_friend(self):
        # set up initial room state
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

        self.floor_card(['SJ', 'C9', 'JK'])
        self.deal('doge0', ['SA', 'SQ', 'S2'])
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
                'type': 'player',
                'player': 'doge3',
                'floor_cards': ['SA', 'SQ', 'S2'],
            }
        )
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.PLAYING)
        self.assertEqual(room['game']['friend'], 'doge3')

    def test_round_friend(self):
        # set up initial room state
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

        self.floor_card(['SJ', 'C9', 'JK'])
        self.deal('doge0', ['SA', 'SQ', 'S2'])
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
                'type': 'round',
                'round': 1,
                'floor_cards': ['SA', 'SQ', 'S2'],
            }
        )
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.PLAYING)
        self.deal('doge0', ['C2'])
        self.deal('doge1', ['C5'])
        self.deal('doge2', ['CK'])
        self.deal('doge3', ['C3'])
        self.deal('doge4', ['C9'])
        self.play('doge0', 'C2')
        self.play('doge1', 'C5')
        self.play('doge2', 'CK')
        self.play('doge3', 'C3')
        self.play('doge4', 'C9')
        room = cache.get('room:test')
        self.assertEqual(room['game']['friend'], 'doge2')

    def test_start_consumer(self):
        # set up initial room state
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
        cache.set('room:test', room)

        client = Client()
        content = {
            'room_id': 'test',
        }
        client.send_and_consume('gameplay-start', content)
        self.flush_all()
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.BIDDING)
        for player in room['players']:
            self.assertEqual(len(player['cards']), 10)
        self.assertEqual(len(room['game']['floor_cards']), 3)

    def test_deal_miss(self):
        # set up initial room state
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

        self.deal('doge0', ['SA', 'JK', 'S10', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'])
        self.deal_miss('doge0')

        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.NOT_PLAYING)
        from websocket.consumers.gameplay_consumers import gameplay_start_consumer
        message = self.get_next_message('gameplay-start', require=True)
        gameplay_start_consumer(message)

        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.BIDDING)

    def test_deal_miss_all_pass(self):
        # set up initial room state
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

        self.deal('doge0', ['SA', 'JK', 'S10', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'])
        self.bid('doge0', 0, '', False)
        self.bid('doge1', 0, '', False)
        self.bid('doge2', 0, '', False)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)

        from websocket.consumers.gameplay_consumers import gameplay_deal_miss_consumer
        message = self.get_next_message('gameplay-deal-miss', require=True)
        gameplay_deal_miss_consumer(message)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.NOT_PLAYING)

        from websocket.consumers.gameplay_consumers import gameplay_start_consumer
        message = self.get_next_message('gameplay-start', require=True)
        gameplay_start_consumer(message)
        room = cache.get('room:test')
        self.assertIs(room['game']['state'], RoomState.BIDDING)

    def test_play_exceptions(self):
        # set up initial room state
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

        self.floor_card(['C2', 'C3', 'C4'])
        self.deal('doge0', ['JK', 'SK', 'S10', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'])
        self.bid('doge0', 13, 'S', True)
        self.bid('doge1', 0, '', False)
        self.bid('doge2', 0, '', False)
        self.bid('doge3', 0, '', False)
        self.bid('doge4', 0, '', False)
        self.friend_select(
            'doge0',
            {
                'type': 'round',
                'round': 2,
                'floor_cards': ['C2', 'C3', 'C4'],
            }
        )
        self.play('doge0', 'SK')
        room = cache.get('room:test')
        self.assertEqual(len(room['game']['table_cards']), 0)

        self.play('doge0', 'JK', joker_suit='S')
        room = cache.get('room:test')
        self.assertEqual(len(room['game']['table_cards']), 1)

        room['game']['turn'] = 0
        room['game']['table_cards'] = []
        cache.set('room:test', room)
        self.deal('doge0', ['SA', 'SK', 'S10', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'])
        self.play('doge0', 'S2')
        room = cache.get('room:test')
        self.assertEqual(len(room['game']['table_cards']), 1)

        room['game']['turn'] = 0
        room['game']['round'] = 9
        room['game']['table_cards'] = []
        cache.set('room:test', room)
        self.deal('doge0', ['JK', 'DA'])
        self.play('doge0', 'DA')
        room = cache.get('room:test')
        self.assertEqual(len(room['game']['table_cards']), 0)

        self.play('doge0', 'JK', joker_suit='S')
        room = cache.get('room:test')
        self.assertEqual(len(room['game']['table_cards']), 1)


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

    def test_win_not_five_cards(self):
        cards = [{'rank': '2', 'suit': 'S'}]

        win = win_card(cards, 'H', False)
        self.assertEqual(win, 0)

        cards = [
            {'rank': '2', 'suit': 'S'},
            {'rank': '4', 'suit': 'S'},
            {'rank': '3', 'suit': 'S'},
        ]

        win = win_card(cards, 'H', False)
        self.assertEqual(win, 1)

    def test_boss_card(self):
        card_history = [
            {'rank': 'Q', 'suit': 'S'},
            {'rank': 'K', 'suit': 'S'},
        ]

        boss = boss_card('S', 'H', card_history)
        self.assertEqual(boss['rank'], 'J')
        self.assertEqual(boss['suit'], 'S')

        boss = boss_card('S', 'S', card_history)
        self.assertEqual(boss['rank'], 'A')
        self.assertEqual(boss['suit'], 'S')
