from django.test import TestCase, Client
from .models import User, create_user
from django.contrib.auth import authenticate
from django.urls import reverse
import json


class ApiTest(TestCase):
    def setUp(self):
        pass

    def test_signup_success(self):
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

    def test_signup_fail(self):
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
