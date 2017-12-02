from random import shuffle


def shuffled_card():
    ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    suits = ['S', 'D', 'C', 'H']
    cards = [{'rank': r, 'suit': s} for r in ranks for s in suits]
    cards.append({'rank': 'JK'})

    return shuffle(cards)


def card_score(cards, giruda):
    score = 0
    mighty_suit = 'S' if giruda != 'S' else 'D'
    for card in cards:
        rank = card['rank']
        suit = card['suit']
        if rank == 'JK':
            score -= 1
        elif rank == 'A' and suit == mighty_suit:
            continue
        elif suit in ['A', 'K', 'Q', 'J', '10']:
            score += 1

    return score


def is_valid_card(card):
    ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    suits = ['S', 'D', 'C', 'H']
    if 'suit' not in card or 'rank' not in card:
        return False

    if card['suit'] not in suits:
        return False

    if card['rank'] not in ranks:
        return False

    return True


def card_in(card, cards):
    for c in cards:
        if c['suit'] == card['suit'] and c['rank'] == card['rank']:
            return True

    return False
