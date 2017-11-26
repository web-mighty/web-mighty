import json


def _to_text(obj):
    return {'text': obj}


# for testing
def request(action, data, nonce=''):
    ret = {
        'nonce': nonce,
        'action': action,
        'data': data,
    }

    return _to_text(json.dumps(ret))


def response(result, nonce=''):
    ret = {
        'nonce': nonce,
        'success': True,
        'result': result,
    }

    return _to_text(json.dumps(ret))


def event(event, data):
    ret = {
        'event': event,
        'data': data,
    }

    return _to_text(json.dumps(ret))


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
