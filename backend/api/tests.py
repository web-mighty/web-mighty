from django.test import TestCase, Client
from .models import User, create_user, Room
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.core.cache import cache
from django.urls import reverse
from django.core.files import File
from django.core import mail
from backend.settings import BASE_DIR
from io import BytesIO
from urllib.parse import unquote_plus
import json
import os


class ApiRoomListTest(TestCase):
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
        from django_redis import get_redis_connection
        get_redis_connection('default').flushdb()

    def test_room_initially_no_rooms(self):
        client = Client()
        client.login(username='skystar', password='doge')

        response = client.get(
            reverse('room')
        )

        data = response.json()
        rooms = data['rooms']

        self.assertEqual(len(rooms), 0)

    def test_room_create_without_password(self):
        client = Client()
        client.login(username='skystar', password='doge')

        post_data = {
            'title': 'doge room',
            'options': {
                'player_number': 5,
            }
        }

        response = client.post(
            reverse('room'),
            json.dumps(post_data),
            content_type='application/json',
        )

        data = response.json()
        room_data = cache.get('room:' + data['room_id'])

        self.assertEqual(response.status_code, 201)
        self.assertEqual(data['room_id'], room_data['room_id'])
        self.assertIs(data['is_private'], False)

        response = client.get(
            reverse('room')
        )

        data = response.json()
        rooms = data['rooms']

        self.assertEqual(rooms[0]['title'], 'doge room')
        self.assertEqual(rooms[0]['is_private'], False)
        self.assertEqual(rooms[0]['player_count'], 0)

    def test_room_create_with_password(self):
        client = Client()
        client.login(username='skystar', password='doge')

        post_data = {
            'title': 'doge room',
            'password': 'dogecoin',
            'options': {
                'player_number': 5,
            }
        }

        response = client.post(
            reverse('room'),
            json.dumps(post_data),
            content_type='application/json',
        )

        data = response.json()
        room_data = cache.get('room:' + data['room_id'])

        self.assertEqual(response.status_code, 201)
        self.assertEqual(data['room_id'], room_data['room_id'])
        self.assertIs(data['is_private'], True)

        self.assertEqual(response.status_code, 201)

        response = client.get(
            reverse('room')
        )

        data = response.json()
        rooms = data['rooms']
        room = Room.objects.get(id=1)

        is_password_valid = check_password('dogecoin', room.password)

        self.assertEqual(rooms[0]['title'], 'doge room')
        self.assertEqual(rooms[0]['is_private'], True)
        self.assertEqual(rooms[0]['player_count'], 0)
        self.assertTrue(is_password_valid)


class ApiProfileTest(TestCase):
    def setUp(self):
        user = create_user(
            username='skystar',
            password='doge',
            nickname='usezmap',
            email='asdf@asdf.com'
        )
        image_path = os.path.join(BASE_DIR, 'api/test_data/test_image.png')

        with open(image_path, 'rb') as f:
            avatar_file = File(f)
            avatar_file.name = 'test_image.png'

            previous_avatar_path = user.profile.avatar.path

            user.profile.avatar = avatar_file
            user.profile.save()

            os.remove(previous_avatar_path)

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_profile_not_authenticated(self):
        client = Client()

        post_data = {
            'nickname': 'new_nick',
        }

        response = client.put(
            reverse('profile', kwargs={'username': 'skystar'}),
            json.dumps(post_data),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)

    def test_get_profile(self):
        client = Client()
        client.login(username='skystar', password='doge')

        response = client.get(
            reverse('profile', kwargs={'username': 'skystar'})
        )

        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['nickname'], 'usezmap')

    def test_edit_profile(self):
        client = Client()
        client.login(username='skystar', password='doge')

        post_data = {
            'nickname': 'new_nick',
        }

        response = client.put(
            reverse('profile', kwargs={'username': 'skystar'}),
            json.dumps(post_data),
            content_type='application/json',
        )

        user = User.objects.get(id=1)

        self.assertEqual(response.status_code, 204)
        self.assertEqual(user.profile.nickname, 'new_nick')

    def test_avatar_not_authenticated(self):
        client = Client()

        response = client.get(
            reverse('avatar')
        )

        self.assertEqual(response.status_code, 401)

    def test_avatar_valid_default_image(self):
        user = create_user(
            username='dogeman',
            password='doge',
            nickname='shiva',
            email='asdfe@asdf.com'
        )

        self.assertTrue('dogeman' in user.profile.avatar.url)
        self.assertTrue('dogeman' in user.profile.avatar.path)

    def test_avatar_valid_image(self):
        client = Client()
        client.login(username='skystar', password='doge')

        image_path = os.path.join(BASE_DIR, 'api/test_data/test_image.png')

        with open(image_path, 'rb') as f:
            response = client.post(
                reverse('avatar'),
                {'avatar': f}
            )

        self.assertEqual(response.status_code, 204)

    def test_avatar_invalid_image(self):
        client = Client()
        client.login(username='skystar', password='doge')

        f = BytesIO(os.urandom(100))
        response = client.post(
            reverse('avatar'),
            {'avatar': f}
        )

        self.assertEqual(response.status_code, 400)

    def test_avatar_large_image(self):
        client = Client()
        client.login(username='skystar', password='doge')

        f = BytesIO(os.urandom(1024 * 1024 * 2))
        response = client.post(
            reverse('avatar'),
            {'avatar': f}
        )

        self.assertEqual(response.status_code, 413)


class ApiSignUpTest(TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_sign_up_success(self):
        client = Client()
        post_data = {
            'username': 'skystar',
            'password': 'doge',
            'nickname': 'nicknick',
            'email': 'asdf@asdf.com',
        }
        client.post(
            reverse('sign_up'),
            json.dumps(post_data),
            content_type='application/json',
        )

        user = User.objects.get(username='skystar')
        self.assertFalse(user.is_active)
        self.assertIsNotNone(cache.get('verify-account:skystar'))

        self.assertEqual(len(mail.outbox), 1)

        body = mail.outbox[0].body
        link = body.split('link.')[1].strip()

        post_data = {
            'token': unquote_plus(link.split('/')[-2].strip()),
        }

        client.post(
            reverse('verify_account'),
            json.dumps(post_data),
            content_type='application/json',
        )

        self.assertIsNone(cache.get('verify-account:skystar'))
        user = authenticate(username='skystar', password='doge')
        self.assertIsNotNone(user)

    def test_sign_up_fail(self):
        client = Client()
        post_data = {
            'username': 'skystar',
            'password': 'doge',
            'email': 'asdf@asdf.com',
        }
        response = client.post(
            reverse('sign_up'),
            json.dumps(post_data),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)

        response = client.get(
            reverse('sign_up'),
        )

        self.assertEqual(response.status_code, 405)

        create_user(
            username='skystar',
            password='doge',
            nickname='test_nick',
            email='asdf@asdf.com',
        )

        post_data = {
            'username': 'not_skystar',
            'password': 'doge',
            'nickname': 'nicknick',
            'email': 'asdf@asdf.com',
        }
        response = client.post(
            reverse('sign_up'),
            json.dumps(post_data),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)


class ApiSignInTest(TestCase):
    def setUp(self):
        create_user(
            username='skystar',
            password='doge',
            nickname='usezmap',
            email='asdf@asdf.com'
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_sign_in_success(self):
        client = Client()
        post_data = {
            'username': 'skystar',
            'password': 'doge',
        }
        response = client.post(
            reverse('sign_in'),
            json.dumps(post_data),
            content_type='application/json',
        )
        data = response.json()
        self.assertEqual(data['username'], 'skystar')

    def test_sign_in_fail(self):
        client = Client()
        post_data = {
            'username': 'skystar',
            'password': 'not doge',
        }
        response = client.post(
            reverse('sign_in'),
            json.dumps(post_data),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)

        response = client.get(
            reverse('sign_in'),
        )
        self.assertEqual(response.status_code, 405)


class ApiSignOutTest(TestCase):
    def test_sign_out_success(self):
        client = Client()

        response = client.get(
            reverse('sign_out'),
        )
        self.assertEqual(response.status_code, 200)

    def test_sign_out_fail(self):
        client = Client()
        post_data = {}
        response = client.post(
            reverse('sign_out'),
            json.dumps(post_data),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 405)


class ApiSessionTest(TestCase):
    def setUp(self):
        create_user(
            username='skystar',
            password='doge',
            nickname='usezmap',
            email='asdf@asdf.com'
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_verify_session_success(self):
        client = Client()
        client.login(username='skystar', password='doge')

        response = client.get(
            reverse('verify_session'),
        )

        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['username'], 'skystar')

    def test_verify_session_with_room_id(self):
        client = Client()
        client.login(username='skystar', password='doge')

        player_room_cache_key = 'player-room:' + 'skystar'
        cache.set(player_room_cache_key, 'doge')

        response = client.get(
            reverse('verify_session'),
        )

        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['username'], 'skystar')
        self.assertEqual(data['room_id'], 'doge')

    def test_verify_session_unauthorized(self):
        client = Client()

        response = client.get(
            reverse('verify_session'),
        )

        self.assertEqual(response.status_code, 401)

    def test_verify_session_not_allowed(self):
        client = Client()

        response = client.post(
            reverse('verify_session'),
            json.dumps({}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 405)


class ModelTest(TestCase):
    def setUp(self):
        create_user(
            username='skystar',
            password='doge',
            nickname='usezmap',
            email='asdf@asdf.com'
        )

    def tearDown(self):
        users = User.objects.all()
        for user in users:
            os.remove(user.profile.avatar.path)

    def test_User_model(self):
        me = authenticate(username='skystar', password='doge')
        self.assertTrue(me)

        me = authenticate(username='skystar', password='not doge')
        self.assertFalse(me)
