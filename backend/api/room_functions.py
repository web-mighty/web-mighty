from .models import Room
import hashlib
import uuid


def get_room_list(page, count_per_page):
    rooms = Room.objects.all()
    start = (page - 1) * count_per_page
    end = page * count_per_page
    selected_rooms = rooms[start:end].values('room_id', 'title', 'is_private')

    return list(selected_rooms)


def create_room(**kwargs):
    room_id = str(uuid.uuid4())
    title = kwargs.get('title', None)
    password = kwargs.get('password', None)

    if password is not None:
        password = hashlib.sha256(
            bytes(password, encoding='utf=8')).hexdigest()
    else:
        password = ''

    if not all([title, ]):
        return None

    new_room = Room(
        room_id=room_id,
        title=title,
        password=password,
        is_private=bool(password),
    )

    new_room.save()

    result_data = {
        'room_id': room_id,
        'title': title,
        'is_private': bool(password),
    }

    return result_data
