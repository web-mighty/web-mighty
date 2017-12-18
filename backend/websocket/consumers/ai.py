from .card import hand_score, suit_count, card_in, is_mighty, c_
from .card import win_card, can_play, boss_card
import random


def _k(giruda):
    def __k(card):
        ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
        if is_mighty(card, giruda):
            return 0
        elif card['rank'] == 'JK':
            return 1
        elif card['suit'] == giruda:
            return ranks.index(card['rank']) + 2
        else:
            return ranks.index(card['rank']) + 15
    return __k


class AI():
    def __init__(self, index):
        nicknames = ['doge', 'bitcoin', 'ethereum', 'egger', 'ha']
        self.data = {
            'username': '*AI-{}'.format(nicknames[index]),
            'reply': 'gameplay-ai',
            'cards': [],
            'bid': 0,
            'score': 0,
        }

    def __getitem__(self, key):
        if key in ['ai', 'ready', 'continue']:
            return True
        return self.data[key]

    def __setitem__(self, key, item):
        if key in ['ai', 'ready', 'continue']:
            return
        self.data[key] = item

    def wanted_card(self, cards, giruda, when):
        joker = {'rank': 'JK', 'suit': None}
        if when == 'kill':
            for r in ['A', 'K', 'Q']:
                if not card_in(c_(r, giruda), cards):
                    return c_(r, giruda)
        elif when == 'friend':
            mighty = c_('A', None)
            if giruda == 'S':
                mighty['suit'] = 'D'
            else:
                mighty['suit'] = 'S'
            if not card_in(mighty, cards):
                return mighty

        if not card_in(joker, cards):
            return joker
        for s in ['S', 'D', 'H', 'C']:
            if s == giruda and when == 'kill':
                continue
            for r in ['A', 'K', 'Q']:
                if is_mighty(c_(r, s), giruda):
                    continue
                if not card_in(c_(r, s), cards):
                    return c_(r, s)

    def bid(self, room_data):
        cards = self.data['cards']
        current_bid = room_data['game']['current_bid']
        player_number = room_data['game']['player_number']
        if hand_score(cards, 'N') <= 0:
            # TODO: deal miss!
            pass
        suit_pair = []
        for g in ['S', 'D', 'H', 'C']:
            suit_pair.append((suit_count(cards, g), g))
        bid_pair = sorted(suit_pair)[-1]
        hand_value = 10 + bid_pair[0]
        minimum_bid = 13 if player_number == 5 else 14
        if len(cards) == 8:
            hand_value += 1

        tuned_bid = current_bid['score']
        if current_bid['giruda'] == 'N':
            tuned_bid += 1

        if hand_value <= tuned_bid or hand_value < minimum_bid:
            ret = {
                'bid': False,
            }
            return ret
        minimum_bid = max(minimum_bid, tuned_bid + 1)
        ret = {
            'bid': True,
            'score': min(minimum_bid, hand_value),
            'giruda': bid_pair[1],
        }
        return ret

    def kill(self, room_data):
        current_bid = room_data['game']['current_bid']
        giruda = current_bid['giruda']
        ret = {
            'card': self.wanted_card(self.data['cards'], giruda, 'kill'),
        }
        return ret

    def friend_select(self, room_data):
        cards = self.data['cards']
        current_bid = room_data['game']['current_bid']
        giruda = current_bid['giruda']
        ret = {
            'type': 'card',
            'card': self.wanted_card(self.data['cards'], giruda, 'friend'),
            'floor_cards': sorted(cards, key=_k(giruda))[-3:]
        }
        return ret

    def play(self, room_data):
        giruda = room_data['game']['giruda']
        players = room_data['players']
        table_cards = room_data['game']['table_cards']
        joker_call = room_data['game']['joker_call']
        president = room_data['game']['president']
        friend = room_data['game']['friend']
        round = room_data['game']['round']
        card_history = room_data['game']['card_history']
        cards = sorted(self.data['cards'], key=_k(giruda))
        filtered_cards = []
        for c in cards:
            if round == 1 and c['rank'] == 'JK':
                continue
            is_playable = can_play(
                c,
                table_cards,
                cards,
                giruda=giruda,
                joker_call=joker_call,
                round=round,
            )
            if is_playable:
                filtered_cards.append(c)
        is_president = president == self.data['username']
        is_friend = False
        if room_data['game']['friend']:
            is_friend = friend == self.data['username']
        elif room_data['game']['friend_selection']['type'] == 'card':
            friend_card = room_data['game']['friend_selection']['card']
            if card_in(friend_card, cards):
                is_friend = True

        turn = room_data['game']['turn']

        if turn == 0:
            play_card = filtered_cards[0]
        else:
            play_card = None
            for c in filtered_cards:
                new_cards = table_cards + [c]
                win = win_card(new_cards, giruda, joker_call, round)
                if win == len(new_cards) - 1:
                    play_card = c
                    break
            if play_card is None:
                play_card = filtered_cards[-1]
            else:
                win = win_card(table_cards, giruda, joker_call, round)
                win_player = players[win]['username']
                if is_friend:
                    if win_player == president:
                        s = table_cards[win]['suit']
                        boss = boss_card(s, giruda, card_history)
                        if table_cards[win] == boss:
                            play_card = filtered_cards[-1]
                elif is_president:
                    if win_player == friend:
                        play_card = filtered_cards[-1]
                else:
                    if win_player not in (president, friend):
                        play_card = filtered_cards[-1]

        ret = {
            'card': play_card,
        }
        if play_card['rank'] == 'JK':
            if is_president or is_friend:
                ret['joker_suit'] = giruda
            else:
                suits = ['S', 'D', 'H', 'C']
                suits.remove(giruda)
                ret['joker_suit'] = random.choice(suits)
        return ret
