import json


def _to_text(obj):
    return {'text': obj}


def error(reason, nonce=''):
    err = {
        'reason': reason,
    }

    ret = {
        'nonce': nonce,
        'success': False,
        'error': err,
    }

    return _to_text(json.dumps(ret))
