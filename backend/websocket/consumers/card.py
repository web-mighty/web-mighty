from random import shuffle


def shuffled_card():
    ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    suits = ['S', 'D', 'C', 'H']
    cards = [{'rank': r, 'suit': s} for r in ranks for s in suits]
    cards.append({'rank': 'JK', 'suit': None})
    shuffle(cards)

    return cards


def c_(rank, suit):
    return {'rank': rank, 'suit': suit}


def hand_score(cards, giruda):
    score = 0
    for card in cards:
        rank = card['rank']
        if rank == 'JK':
            score -= 1
        elif is_mighty(card, giruda):
            continue
        elif rank in ['A', 'K', 'Q', 'J', '10']:
            score += 1

    return score


def card_score(card):
    if card['rank'] in ['A', 'K', 'Q', 'J', '10']:
        return 1
    return 0


def is_valid_card(card):
    if isinstance(card, dict) is False:
        return False

    ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    suits = ['S', 'D', 'C', 'H']
    if card['rank'] == 'JK':
        return True
    if 'suit' not in card or 'rank' not in card:
        return False

    if card['suit'] not in suits:
        return False

    if card['rank'] not in ranks:
        return False

    return True


def card_in(card, cards):
    for c in cards:
        if is_same_card(c, card):
            return True

    return False


def card_index(card, cards):
    for i, c in enumerate(cards):
        if is_same_card(c, card):
            return i

    return -1


def is_mighty(card, giruda):
    if giruda != 'S' and card['suit'] == 'S' and card['rank'] == 'A':
        return True
    elif giruda == 'S' and card['suit'] == 'D' and card['rank'] == 'A':
        return True
    return False


def is_joker_call(card, giruda):
    if giruda != 'C' and card['suit'] == 'C' and card['rank'] == '3':
        return True
    elif giruda == 'C' and card['suit'] == 'H' and card['rank'] == '3':
        return True
    return False


def is_same_card(card1, card2):
    if card1['rank'] == 'JK' and card1['rank'] == card2['rank']:
        return True
    if card1['rank'] == card2['rank'] and card1['suit'] == card2['suit']:
        return True
    return False


def filter_score_card(cards):
    score_cards = []
    for card in cards:
        if card['rank'] in ['10', 'J', 'Q', 'K', 'A']:
            score_cards.append(card)
    return score_cards


def suit_in(cards, suit):
    for card in cards:
        if card['suit'] == suit:
            return True
    return False


def suit_count(cards, suit):
    count = 0
    for card in cards:
        if card['suit'] == suit:
            count += 1
    return count


def win_card(cards, giruda, joker_call, round=-1):
    for i, card in enumerate(cards):
        if is_mighty(card, giruda):
            return i

    if round == 1 or round == 10:
        joker_call = True

    if not joker_call:
        for i, card in enumerate(cards):
            if card['rank'] == 'JK':
                return i

    ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    if giruda != 'N':
        mi, mr = -1, -1
        for i, card in enumerate(cards):
            if card['rank'] == 'JK':
                continue
            if card['suit'] != giruda:
                continue
            r = ranks.index(card['rank'])
            if r > mr:
                mr = r
                mi = i
        if mi != -1:
            return mi
    table_suit = cards[0]['suit']
    mi, mr = -1, -1
    for i, card in enumerate(cards):
        if card['rank'] == 'JK':
            continue
        if card['suit'] != table_suit:
            continue
        r = ranks.index(card['rank'])
        if r > mr:
            mr = r
            mi = i
    return mi


def can_play(card, table, cards, giruda='N', joker_call=False, round=0):
    if not card_in(card, cards):
        return False
    is_joker_in = card_in({'rank': 'JK', 'suit': None}, cards)
    turn = len(table)

    if round == 1:
        if turn == 0 and card['suit'] == giruda:
            giruda_count = suit_count(cards, giruda)
            if giruda_count != 10:
                return False

    if is_joker_in and round == 9:
        if card['rank'] != 'JK':
            return False

    if turn != 0:
        if joker_call and is_joker_in:
            if card['rank'] != 'JK' and not is_mighty(card, giruda):
                return False

        if card['rank'] != 'JK' and not is_mighty(card, giruda):
            table_suit = table[0]['suit']
            if table_suit != card['suit']:
                if suit_in(cards, table_suit) != 0:
                    return False
    return True


def boss_card(suit, giruda, card_history):
    ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    all_cards = [{'rank': r, 'suit': suit} for r in ranks]
    if giruda == 'S':
        mighty = {'rank': 'A', 'suit': 'D'}
    else:
        mighty = {'rank': 'A', 'suit': 'S'}
    if card_in(mighty, all_cards):
        all_cards.remove(mighty)
    for c in card_history:
        if card_in(c, all_cards):
            all_cards.remove(c)
    if len(all_cards) == 0:
        return None
    return all_cards[0]


def code_to_card(code):
    # SA (Spade A), JK (Joker)
    if code == 'JK':
        return {'rank': 'JK', 'suit': None}
    return {'rank': code[1:], 'suit': code[0]}
