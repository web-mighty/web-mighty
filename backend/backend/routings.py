from channels.routing import route, include


channel_routings = [
    route('websocket.connect', 'websocket.consumers.multiplexer.websocket_connect'),
    route('websocket.receive', 'websocket.consumers.multiplexer.websocket_receive'),
    route('websocket.disconnect', 'websocket.consumers.multiplexer.websocket_disconnect'),
    include('websocket.consumers.multiplexer.multiplexer_routings'),
]
