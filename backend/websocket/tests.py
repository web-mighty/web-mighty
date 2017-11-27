from channels.test import ChannelTestCase, WSClient
from websocket.consumers.consumer_utils import request
from websocket.consumers.room_consumers import room_join_consumer
from websocket.consumers.room_consumers import room_leave_consumer
from api.models import create_user
from api.models import Room
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core.cache import cache

import os
import json


class MultiplexerTest(ChannelTestCase):
    def setUp(self):
        create_user(
            username='skystar',
            password='doge',
            nickname='usezmap',
            email='asdf@asdf.com'
        )

        cache.clear()

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_connection_not_authenticated(self):
        client = WSClient()
        client.send_and_consume('websocket.connect', path='/api/websocket/')
        response = client.receive()
        self.assertIn('event', response)
        self.assertEqual(response['data']['reason'], 'Not authenticated')
        self.assertEqual(response['data']['type'], 'connection')

    def test_connection_authenticated(self):
        self.assertIsNone(cache.get('session:skystar'))

        client = WSClient()
        client.login(username='skystar', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')

        self.assertIsNotNone(cache.get('session:skystar'))

    def test_connection_session_duplication(self):
        first_client = WSClient()
        second_client = WSClient()

        first_client.login(username='skystar', password='doge')
        second_client.login(username='skystar', password='doge')

        first_client.send_and_consume('websocket.connect', path='/api/websocket/')
        session_cache = cache.get('session:skystar')
        self.assertIsNotNone(session_cache)

        second_client.send_and_consume('websocket.connect', path='/api/websocket/')

        response = second_client.receive()

        self.assertIn('event', response)
        self.assertEqual(response['data']['reason'], 'Session duplication detected')
        self.assertEqual(response['data']['type'], 'connection')

        self.assertEqual(cache.get('session:skystar'), session_cache)

    def test_connection_force_login(self):
        first_client = WSClient()
        second_client = WSClient()

        first_client.login(username='skystar', password='doge')
        second_client.login(username='skystar', password='doge')

        first_client.send_and_consume('websocket.connect', path='/api/websocket/')
        session_cache = cache.get('session:skystar')
        self.assertIsNotNone(session_cache)

        second_client.send_and_consume('websocket.connect', path='/api/websocket/?force=true')
        first_client.receive()

        data = {
            'text': json.dumps({'action': 'room-join', 'data': {}})
        }

        first_client.send_and_consume('websocket.receive', data, path='/api/websocket/')

        response = first_client.receive()

        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'Session duplication detected')
        self.assertEqual(response['error']['type'], 'receive')

        self.assertNotEqual(cache.get('session:skystar'), session_cache)

    def test_receive_malformed_data(self):
        client = WSClient()
        client.login(username='skystar', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')

        session_cache = cache.get('session:skystar')
        self.assertIsNotNone(session_cache)

        data = {
            'text': 'hello doge!',
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'Invalid data')
        self.assertEqual(response['error']['type'], 'receive')

        data = {
            'text': json.dumps({'action': 'room-join', 'data': {}})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'No nonce')
        self.assertEqual(response['error']['type'], 'receive')

        data = {
            'text': json.dumps({'nonce': 'asdf', 'data': {}})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'No action')
        self.assertEqual(response['error']['type'], 'receive')

        data = {
            'text': json.dumps({'action': 'room-join', 'nonce': 'asdf'})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'No data')
        self.assertEqual(response['error']['type'], 'receive')

        data = {
            'text': json.dumps({'action': 'doge-action', 'nonce': 'asdf', 'data': {}})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'Invalid action')
        self.assertEqual(response['error']['type'], 'receive')


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

    def test_room_join_broadcast(self):
        client1 = WSClient()
        client1.login(username='skystar1', password='doge')
        client1.send_and_consume('websocket.connect', path='/api/websocket/')
        client2 = WSClient()
        client2.login(username='skystar2', password='doge')
        client2.send_and_consume('websocket.connect', path='/api/websocket/')
        client1.receive()
        client2.receive()

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

        # TODO: full room


class RoomLeaveTest(ChannelTestCase):
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

    def test_room_leave(self):
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

        req = request('room-leave', {}, nonce='test')
        client1.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_leave_consumer(self.get_next_message('room-leave'))

        response = client1.receive()

        self.assertTrue(response['success'])
        self.assertEqual(response['result'], {})

        player_room_cache = cache.get('player-room:skystar1')
        self.assertIsNone(player_room_cache)

        room_cache = cache.get('room:room')
        self.assertEqual(len(room_cache['players']), 1)

        response = client2.receive()

        self.assertEqual(response['event'], 'room-leave')
        self.assertEqual(response['data']['player'], 'skystar1')
        self.assertEqual(room_cache['players'][0]['username'], 'skystar2')

        req = request('room-leave', {}, nonce='test')
        client2.send_and_consume('websocket.receive', req, path='/api/websocket/')

        room_leave_consumer(self.get_next_message('room-leave'))

        room_cache = cache.get('room:room')

        self.assertIsNone(room_cache)
        self.assertFalse(Room.objects.filter(room_id='room').exists())

    def test_room_leave_disconnected(self):
        pass
