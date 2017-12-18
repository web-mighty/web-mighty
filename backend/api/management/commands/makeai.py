from django.core.management.base import BaseCommand
from api.models import create_user, User


class Command(BaseCommand):
    help = 'bootstrap with initial AI user'

    def handle(self, *args, **kwargs):
        nicknames = ['doge', 'bitcoin', 'ethereum', 'egger', 'ha']

        for nick in nicknames:
            ai_name = '*AI-' + nick
            try:
                user = User.objects.get(username=ai_name)
            except User.DoesNotExist:
                self.stdout.write('Creating {}...'.format(ai_name))
                user = create_user(
                    username=ai_name,
                    password='doge',
                    nickname='doge',
                    email='doge@web-mighty.net',
                )
                user.is_active = False
                user.save()
