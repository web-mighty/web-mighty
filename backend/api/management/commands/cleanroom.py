from django.core.management.base import BaseCommand
from api.models import Room


class Command(BaseCommand):
    help = 'command for cleaning Room model'

    def handle(self, *args, **kwargs):
        rooms = Room.objects.all()

        self.stdout.write('Total rooms: {}\n'.format(rooms.count()))
        for room in rooms:
            self.stdout.write('Deleting room {}...'.format(room.id))
            room.delete()

        self.stdout.write('Room cleaning done!')
