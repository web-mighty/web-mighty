import json


def _to_text(obj):
    return {'text': obj}


def reply_error(reason, nonce='', type=''):
    err = {
        'reason': reason,
        'type': type,
    }

    ret = {
        'nonce': nonce,
        'success': False,
        'error': err,
    }

    return _to_text(json.dumps(ret))


def event_error(reason, type=''):
    ret = {
        'event': 'error',
        'data': {
            'reason': reason,
            'type': type,
        }
    }

    return _to_text(json.dumps(ret))
