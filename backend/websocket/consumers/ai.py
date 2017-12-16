from .card import hand_score, suit_count, card_in, is_mighty, c_


class AI():
    def __init__(self, index):
        self.data = {
            'username': 'AI{}'.format(index),
            'reply': 'gameplay-ai',
            'ready': True,
            'cards': [],
            'bid': 0,
            'score': 0,
            'continue': True,
            'ai': True,
        }

    def __getitem__(self, key):
        return self.data[key]

    def __setitem__(self, key, item):
        self.data[key] = item

    def wanted_card(self, cards, giruda, when):
        joker = {'rank': 'JK', 'suit': None}
        if when == 'kill':
            for r in ['A', 'K', 'Q']:
                if not card_in(c_(r, giruda), cards):
                    return c_(r, giruda),
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
                    return c_(r, s),

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
            'card': self.wanted_card(self.cards, giruda, 'kill'),
        }
        return ret

    def friend_select(self, room_data):
        current_bid = room_data['game']['current_bid']
        giruda = current_bid['giruda']
        ret = {
            'type': 'card',
            'card': self.wanted_card(self.cards, giruda, 'friend'),
        }
        return ret

    def play(self, room_data):
        pass
