from channels.test import ChannelTestCase, WSClient
from api.models import create_user
from django.contrib.auth.models import User
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
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'Not Authenticated')

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

        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'Session duplication detected')

        self.assertEqual(cache.get('session:skystar'), session_cache)

    def test_receive_malformed_data(self):
        client = WSClient()
        client.login(username='skystar', password='doge')
        client.send_and_consume('websocket.connect', path='/api/websocket/')

        session_cache = cache.get('session:skystar')
        self.assertIsNotNone(session_cache)

        data = {
            'text': json.dumps({'action': 'room-join', 'data': {}})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'No nonce')

        data = {
            'text': json.dumps({'nonce': 'asdf', 'data': {}})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'No action')

        data = {
            'text': json.dumps({'action': 'room-join', 'nonce': 'asdf'})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'No data')

        data = {
            'text': json.dumps({'action': 'doge-action', 'nonce': 'asdf', 'data': {}})
        }

        client.send_and_consume('websocket.receive', data, path='/api/websocket/')
        response = client.receive()
        self.assertIn('error', response)
        self.assertEqual(response['error']['reason'], 'Invalid action')
