from channels.test import ChannelTestCase, WSClient
from websocket.consumers.consumer_utils import request
from websocket.consumers.room_consumers import room_join_consumer
from websocket.consumers.room_consumers import room_leave_consumer
from websocket.consumers.room_consumers import room_ready_consumer
from websocket.consumers.room_consumers import room_start_consumer
from websocket.consumers.room_consumers import room_reset_consumer
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.cache import cache
from api.models import Room
from api.models import create_user

import os


class RoomJoinTest(ChannelTestCase):
    def setUp(self):
        cache.clear()

        for i in range(3):
            create_user(
                username='skystar{}'.format(i + 1),
                password='doge',
                nickname='usezmap',
                email='asdf@asdf.com'
            )

        Room.objects.create(
            room_id='room',
            title='doge room',
            is_private=False,
            password='',
            player_number=2
        )

        Room.objects.create(
            room_id='room2',
            title='doge room2',
            is_private=True,
            password=make_password('pass'),
            player_number=2
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_room_join(self):
        client = WSClient()
        client.login(username='skystar1', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')
        client.receive()

        data = {
            'room_id': 'room',
        }

        req = request('room-join', data, nonce='test')

        client.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        response = client.receive()

        room_cache = cache.get('room:room')
        player_room_cache = cache.get('player-room:skystar1')

        self.assertTrue(response['success'])

        result = response['result']

        self.assertEqual(result['room_id'], 'room')
        self.assertEqual(result['room_id'], player_room_cache)
        self.assertEqual(len(room_cache['players']), 1)
        self.assertEqual(room_cache['players'][0]['username'], 'skystar1')

    def test_room_join_with_password(self):
        client = WSClient()
        client.login(username='skystar1', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')
        client.receive()

        data = {
            'room_id': 'room2',
            'password': 'pass'
        }

        req = request('room-join', data, nonce='test')

        client.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        response = client.receive()

        room_cache = cache.get('room:room2')
        player_room_cache = cache.get('player-room:skystar1')

        self.assertTrue(response['success'])

        result = response['result']

        self.assertEqual(result['room_id'], 'room2')
        self.assertEqual(result['room_id'], player_room_cache)
        self.assertEqual(len(room_cache['players']), 1)
        self.assertEqual(room_cache['players'][0]['username'], 'skystar1')

    def test_room_join_with_wrong_password(self):
        client = WSClient()
        client.login(username='skystar1', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')
        client.receive()

        data = {
            'room_id': 'room2',
            'password': 'not pass'
        }

        req = request('room-join', data, nonce='test')

        client.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        response = client.receive()

        room_cache = cache.get('room:room2')
        player_room_cache = cache.get('player-room:skystar1')

        self.assertFalse(response['success'])
        self.assertEqual(response['error']['reason'], 'Password mismatch')

        self.assertIsNone(player_room_cache)
        self.assertEqual(len(room_cache['players']), 0)

    def test_room_join_with_wrong_room_id(self):
        client = WSClient()
        client.login(username='skystar1', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')
        client.receive()

        data = {
            'room_id': 'room3',
        }

        req = request('room-join', data, nonce='test')

        client.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        response = client.receive()

        player_room_cache = cache.get('player-room:skystar1')

        self.assertFalse(response['success'])
        self.assertEqual(response['error']['reason'], 'Room does not exist')
        self.assertIsNone(player_room_cache)

    def test_room_join_broadcast(self):
        client1 = WSClient()
        client1.login(username='skystar1', password='doge')
        client1.send_and_consume('websocket.connect', path='/api/websocket/')
        client2 = WSClient()
        client2.login(username='skystar2', password='doge')
        client2.send_and_consume('websocket.connect', path='/api/websocket/')
        client3 = WSClient()
        client3.login(username='skystar3', password='doge')
        client3.send_and_consume('websocket.connect', path='/api/websocket/')
        client1.receive()
        client2.receive()
        client3.receive()

        data = {
            'room_id': 'room',
        }

        req = request('room-join', data, nonce='test')

        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')
        room_join_consumer(self.get_next_message('room-join'))
        client1.receive()

        self.assertEqual(client1.receive()['data']['player'], 'skystar1')

        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')
        room_join_consumer(self.get_next_message('room-join'))

        self.assertEqual(len(client2.receive()['result']['players']), 2)

        response = client1.receive()

        room_cache = cache.get('room:room')

        self.assertIn('event', response)
        self.assertEqual(response['event'], 'room-join')

        result = response['data']

        self.assertEqual(len(room_cache['players']), 2)
        self.assertEqual(room_cache['players'][0]['username'], 'skystar1')
        self.assertEqual(room_cache['players'][1]['username'], 'skystar2')

        self.assertEqual(result['player'], 'skystar2')

        client3.send_and_consume('websocket.receive', req, path='/api/websocket/')
        room_join_consumer(self.get_next_message('room-join'))

        response = client3.receive()
        self.assertFalse(response['success'])
        self.assertEqual(response['error']['reason'], 'Room is full')


class RoomLeaveTest(ChannelTestCase):
    def setUp(self):
        cache.clear()

        for i in range(3):
            create_user(
                username='skystar{}'.format(i + 1),
                password='doge',
                nickname='usezmap',
                email='asdf@asdf.com'
            )

        Room.objects.create(
            room_id='room',
            title='doge room',
            is_private=False,
            password='',
            player_number=3
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_room_leave(self):
        client1 = WSClient()
        client1.login(username='skystar1', password='doge')
        client1.send_and_consume('websocket.connect', path='/api/websocket/')
        client1.receive()

        client2 = WSClient()
        client2.login(username='skystar2', password='doge')
        client2.send_and_consume('websocket.connect', path='/api/websocket/')
        client2.receive()

        client3 = WSClient()
        client3.login(username='skystar3', password='doge')
        client3.send_and_consume('websocket.connect', path='/api/websocket/')
        client3.receive()

        data = {
            'room_id': 'room',
        }

        req = request('room-join', data, nonce='test')

        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client1.receive()
        client1.receive()

        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client2.receive()
        client2.receive()
        client1.receive()

        client3.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client3.receive()
        client3.receive()
        client1.receive()
        client2.receive()

        req = request('room-leave', {}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_leave_consumer(self.get_next_message('room-leave'))

        response = client1.receive()

        self.assertTrue(response['success'])
        self.assertEqual(response['result'], {})

        player_room_cache = cache.get('player-room:skystar1')
        self.assertIsNone(player_room_cache)

        room_cache = cache.get('room:room')
        self.assertEqual(len(room_cache['players']), 2)

        response = client2.receive()
        client3.receive()

        self.assertEqual(response['event'], 'room-leave')
        self.assertEqual(response['data']['player'], 'skystar1')
        self.assertEqual(room_cache['players'][0]['username'], 'skystar2')
        self.assertIsNotNone(cache.get('session:skystar1'))
        self.assertIsNone(cache.get('player-room:skystar1'))

        client2.send_and_consume('websocket.disconnect', path='/api/websocket')

        room_leave_consumer(self.get_next_message('room-leave'))

        room_cache = cache.get('room:room')

        response = client3.receive()

        self.assertEqual(response['event'], 'room-leave')
        self.assertEqual(response['data']['player'], 'skystar2')
        self.assertEqual(room_cache['players'][0]['username'], 'skystar3')
        self.assertIsNone(cache.get('session:skystar2'))
        self.assertIsNone(cache.get('player-room:skystar2'))

        req = request('room-leave', {}, nonce='test')
        client3.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_leave_consumer(self.get_next_message('room-leave'))

        room_cache = cache.get('room:room')

        self.assertIsNone(room_cache)
        self.assertFalse(Room.objects.filter(room_id='room').exists())


class RoomReadyTest(ChannelTestCase):
    def setUp(self):
        cache.clear()

        for i in range(2):
            create_user(
                username='skystar{}'.format(i + 1),
                password='doge',
                nickname='usezmap',
                email='asdf@asdf.com'
            )

        Room.objects.create(
            room_id='room',
            title='doge room',
            is_private=False,
            password='',
            player_number=2
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_room_ready(self):
        client1 = WSClient()
        client1.login(username='skystar1', password='doge')
        client1.send_and_consume('websocket.connect', path='/api/websocket/')
        client1.receive()

        client2 = WSClient()
        client2.login(username='skystar2', password='doge')
        client2.send_and_consume('websocket.connect', path='/api/websocket/')
        client2.receive()

        data = {
            'room_id': 'room',
        }

        req = request('room-join', data, nonce='test')

        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client1.receive()
        client1.receive()

        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client2.receive()
        client2.receive()
        client1.receive()

        req = request('room-ready', {'ready': True}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_ready_consumer(self.get_next_message('room-ready'))
        room_cache = cache.get('room:room')

        response = client1.receive()

        self.assertTrue(response['success'])
        self.assertTrue(room_cache['players'][0]['ready'])
        self.assertFalse(room_cache['players'][1]['ready'])

        client1.receive()
        response = client2.receive()

        self.assertEqual(response['event'], 'room-ready')
        self.assertEqual(response['data']['player'], 'skystar1')

        req = request('room-ready', {'ready': False}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_ready_consumer(self.get_next_message('room-ready'))
        room_cache = cache.get('room:room')

        response = client1.receive()

        self.assertTrue(response['success'])
        self.assertFalse(room_cache['players'][0]['ready'])


class RoomStartTest(ChannelTestCase):
    def setUp(self):
        cache.clear()

        for i in range(2):
            create_user(
                username='skystar{}'.format(i + 1),
                password='doge',
                nickname='usezmap',
                email='asdf@asdf.com'
            )

        Room.objects.create(
            room_id='room',
            title='doge room',
            is_private=False,
            password='',
            player_number=2
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_room_start(self):
        client1 = WSClient()
        client1.login(username='skystar1', password='doge')
        client1.send_and_consume('websocket.connect', path='/api/websocket/')
        client1.receive()

        client2 = WSClient()
        client2.login(username='skystar2', password='doge')
        client2.send_and_consume('websocket.connect', path='/api/websocket/')
        client2.receive()

        data = {
            'room_id': 'room',
        }

        req = request('room-join', data, nonce='test')

        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client1.receive()
        client1.receive()

        req = request('room-ready', {'ready': True}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_ready_consumer(self.get_next_message('room-ready'))

        client1.receive()
        client1.receive()

        req = request('room-start', {}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_start_consumer(self.get_next_message('room-start'))

        response = client1.receive()

        self.assertFalse(response['success'])
        self.assertEqual(response['error']['reason'], 'Not enough players')

        req = request('room-join', data, nonce='test')
        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client2.receive()
        client2.receive()
        client1.receive()

        req = request('room-ready', {'ready': True}, nonce='test')
        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_ready_consumer(self.get_next_message('room-ready'))

        client2.receive()
        client2.receive()
        client1.receive()

        req = request('room-start', {}, nonce='test')
        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_start_consumer(self.get_next_message('room-start'))

        response = client2.receive()

        self.assertFalse(response['success'])
        self.assertEqual(response['error']['reason'], 'You are not host')

        room_cache = cache.get('room:room')

        self.assertFalse(room_cache['is_playing'])

        req = request('room-start', {}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_start_consumer(self.get_next_message('room-start'))

        response = client1.receive()
        self.assertTrue(response['success'])

        response = client1.receive()
        self.assertEqual(response['event'], 'room-start')

        response = client2.receive()
        self.assertEqual(response['event'], 'room-start')

        room_cache = cache.get('room:room')

        self.assertTrue(room_cache['is_playing'])


class RoomResetTest(ChannelTestCase):
    def setUp(self):
        cache.clear()

        for i in range(2):
            create_user(
                username='skystar{}'.format(i + 1),
                password='doge',
                nickname='usezmap',
                email='asdf@asdf.com'
            )

        Room.objects.create(
            room_id='room',
            title='doge room',
            is_private=False,
            password='',
            player_number=2
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_room_reset(self):
        client1 = WSClient()
        client1.login(username='skystar1', password='doge')
        client1.send_and_consume('websocket.connect', path='/api/websocket/')
        client1.receive()

        client2 = WSClient()
        client2.login(username='skystar2', password='doge')
        client2.send_and_consume('websocket.connect', path='/api/websocket/')
        client2.receive()

        data = {
            'room_id': 'room',
        }

        req = request('room-join', data, nonce='test')

        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client1.receive()
        client1.receive()

        req = request('room-join', data, nonce='test')
        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_join_consumer(self.get_next_message('room-join'))

        client2.receive()
        client2.receive()
        client1.receive()

        room_cache = cache.get('room:room')
        room_cache['is_playing'] = True
        cache.set('room:room', room_cache)

        req = request('room-leave', {}, nonce='test')
        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_leave_consumer(self.get_next_message('room-leave'))

        response = client1.receive()

        self.assertEqual(response['event'], 'room-leave')
        self.assertEqual(response['data']['player'], 'skystar2')

        room_reset_consumer(self.get_next_message('room-reset'))

        response = client1.receive()

        self.assertEqual(response['event'], 'room-reset')
        players = response['data']['players']
        self.assertEqual(players[0]['username'], 'skystar1')

        room_cache = cache.get('room:room')

        new_room_data = {
            'room_id': 'room',
            'players': players,
            'options': {
                'player_number': 2,
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

        self.assertEqual(room_cache, new_room_data)
