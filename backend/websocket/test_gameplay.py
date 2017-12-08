from django.test import TestCase
from channels.test import ChannelTestCase, WSClient
from api.models import create_user
from django.contrib.auth.models import User
from django.core.cache import cache
from websocket.consumers.card import win_card


class GameplayTest(ChannelTestCase):
    pass


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
