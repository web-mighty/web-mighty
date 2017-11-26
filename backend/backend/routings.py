from channels.routing import route, include


channel_routings = [
    route('websocket.connect',
          'websocket.consumers.multiplexer.websocket_connect', path=r'^/api/websocket/'),
    route('websocket.receive',
          'websocket.consumers.multiplexer.websocket_receive', path=r'^/api/websocket/'),
    route('websocket.disconnect', 'websocket.consumers.multiplexer.websocket_disconnect'),
    include('websocket.consumers.multiplexer.multiplexer_routings'),
]
