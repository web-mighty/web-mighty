from random import shuffle


def shuffled_card():
    ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
    suits = ['S', 'D', 'C', 'H']
    cards = [{'rank': r, 'suit': s} for r in ranks for s in suits]
    cards.append({'rank': 'JK', 'suit': None})

    return shuffle(cards)
