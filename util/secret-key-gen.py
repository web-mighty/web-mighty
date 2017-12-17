# From https://gist.github.com/ndarville/3452907

"""
Two things are wrong with Django's default `SECRET_KEY` system:

1. It is not random but pseudo-random
2. It saves and displays the SECRET_KEY in `settings.py`

This snippet
1. uses `SystemRandom()` instead to generate a random key
2. saves a local `secret.txt`

The result is a random and safely hidden `SECRET_KEY`.
"""

import os
import random

SECRET_FILE = os.path.join(os.environ['PROJECT_PATH'], 'secret.py')
SECRET_KEY = ''.join([random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50)])
secret = open(SECRET_FILE, 'w')
content = """
SECRET_KEY = '{}'
MAILGUN_API_KEY = ''
""".format(SECRET_KEY)
secret.write(content)
secret.close()
