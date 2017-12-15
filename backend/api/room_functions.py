from .models import Room
from django.contrib.auth.hashers import make_password
import uuid


def get_room_list(page, count_per_page):
    rooms = Room.objects.all()
    start = (page - 1) * count_per_page
    end = page * count_per_page
    selected_rooms = rooms[start:end].values(
        'room_id',
        'title',
        'is_private',
        'player_number',
        'player_count',
    )

    return list(selected_rooms)


def create_room(**kwargs):
    room_id = str(uuid.uuid4())
    title = kwargs.get('title', None)
    password = kwargs.get('password', None)

    options = kwargs.get('options', {})
    player_number = options.get('player_number', 0)

    if player_number not in (5, 6):
        return None

    if password is not None:
        password = make_password(password)
    else:
        password = ''

    if not all([title, ]):
        return None

    new_room = Room(
        room_id=room_id,
        title=title,
        password=password,
        is_private=bool(password),

        player_number=player_number,
    )

    new_room.save()

    result_data = {
        'room_id': room_id,
        'title': title,
        'is_private': bool(password),
        'player_number': player_number,
    }

    return result_data
