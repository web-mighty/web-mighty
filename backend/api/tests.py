from django.test import TestCase, Client
from .models import User, create_user
from django.contrib.auth import authenticate
from django.urls import reverse
import json


class ApiSignUpTest(TestCase):
    def setUp(self):
        pass

    def test_sign_up_success(self):
        client = Client()
        post_data = {
            'username': 'skystar',
            'password': 'doge',
            'nickname': 'nicknick',
            'email': 'asdf@asdf.com',
        }
        response = client.post(
            reverse('sign_up'),
            json.dumps(post_data),
            content_type='application/json',
        )

        user = authenticate(username='skystar', password='doge')
        self.assertTrue(user)

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


class ApiSignInTest(TestCase):
    def setUp(self):
        User.objects.create_user(
            username='skystar',
            password='doge',
        )

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
        data = json.loads(response.content.decode())
        self.assertEqual(data['id'], 1)
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


class ModelTest(TestCase):
    def setUp(self):
        create_user(
            username='skystar',
            password='doge',
            nickname='usezmap',
            email='asdf@asdf.com'
        )

    def test_User_model(self):
        me = authenticate(username='skystar', password='doge')
        self.assertTrue(me)

        me = authenticate(username='skystar', password='not doge')
        self.assertFalse(me)
