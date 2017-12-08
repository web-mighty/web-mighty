from enum import Enum


class RoomState(Enum):
    NOT_PLAYING = 0
    BIDDING = 1
    KILL_SELECTING = 2
    FRIEND_SELECTING = 3
    PLAYING = 4
