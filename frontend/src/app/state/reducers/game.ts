import { AppActions } from '../app-actions';
import * as GameActions from '../actions/game';
import * as WebSocketActions from '../actions/websocket';

import * as WebSocket from '../../websocket';

export namespace MightyState {
  export interface Bidding {
    type: 'bidding';
    bidHistory: WebSocket.Data.BidEvent[];
  }
  export interface DealMiss {
    type: 'deal-miss';
    player: string;
    hand: WebSocket.Data.Card[];
  }
  export interface Elected {
    type: 'elected';
    result: WebSocket.Data.ElectionResult;
    friendDecl: WebSocket.Data.Friend | null;
    selectedCards: WebSocket.Data.Card[] | null;
    error: string | null;
  }
  export interface Playing {
    type: 'playing';
    bid: WebSocket.Data.BidCore;
    president: string;
    friend: string | null;
    friendDecl: WebSocket.Data.Friend;
    cards: { [username: string]: WebSocket.Data.CardPlay };
    scoreCards: { [username: string]: WebSocket.Data.Card[] };
  }

  export type State
    = Bidding
    | DealMiss
    | Elected
    | Playing
  ;
}

export namespace GameRoomState {
  export interface NotInRoom {
    type: 'not-in-room';
  }
  export interface Joining {
    type: 'joining';
    to: string;
  }
  export interface NotStarted {
    type: 'not-started';
    room: WebSocket.Data.Room;
  }
  export interface Started {
    type: 'started';
    hand: WebSocket.Data.Card[];
    room: WebSocket.Data.Room;
    turnOf: string;
    state: MightyState.State;
  }
  export interface Result {
    type: 'result';
  }
  export interface Leaving {
    type: 'leaving';
  }

  export type State
    = NotInRoom
    | Joining
    | NotStarted
    | Started
    | Result
    | Leaving
  ;
}

export type GameState = GameRoomState.State;


function recommendFriend(
  hand: WebSocket.Data.Card[],
  giruda: WebSocket.Data.Giruda,
): WebSocket.Data.Friend {
  const mightySuit = giruda === 'S' ? 'D' : 'S';

  const hasMighty =
    hand.find(
      card => card.rank === 'A' && card.suit === mightySuit
    ) != null;
  const hasJoker =
    hand.find(
      card => card.rank === 'JK'
    ) != null;
  const suitPref = ['S', 'D', 'C', 'H'].filter(x => x !== giruda);
  if (giruda !== 'N') {
    suitPref.unshift(giruda);
  }

  if (!hasMighty) {
    const card: WebSocket.Data.NormalCard = { suit: mightySuit, rank: 'A' };
    return {
      type: 'card',
      card,
    };
  }
  if (!hasJoker) {
    return {
      type: 'card',
      card: { rank: 'JK' },
    };
  }
  for (const suit of suitPref) {
    for (const rank of ['A', 'K', 'Q']) {
      if (hand.find((card: WebSocket.Data.NormalCard) => card.rank === rank && card.suit === suit) == null) {
        const card: any = { suit, rank };
        return {
          type: 'card',
          card,
        };
      }
    }
  }
  console.error('Failed to recommend Friend.');
  return {
    type: 'card',
    card: { suit: mightySuit, rank: 'A' },
  };
}

function updateFriendDecl(
  original: WebSocket.Data.Friend,
  action: GameActions.FriendSelect.Actions,
  hand: WebSocket.Data.Card[],
  giruda: WebSocket.Data.Giruda,
): WebSocket.Data.Friend {
  switch (action.type) {
    case GameActions.FriendSelect.CHANGE_TYPE: {
      switch (action.friendType) {
        case 'card':
          return recommendFriend(hand, giruda);
        case 'player':
          return {
            type: 'player',
            player: '',
          };
        case 'round':
          return {
            type: 'round',
            round: 1,
          };
        case 'no':
          return {
            type: 'no',
          };
        default:
          console.error('Invalid friend type.');
          return original;
      }
    }
    case GameActions.FriendSelect.TOGGLE_JOKER:
      if (original.type === 'card') {
        if (original.card.rank === 'JK') {
          return recommendFriend(hand, giruda);
        } else {
          return {
            type: 'card',
            card: { rank: 'JK' },
          };
        }
      } else {
        return original;
      }
    case GameActions.FriendSelect.CHANGE_CARD:
      if (original.type === 'card') {
        if (original.card.rank === 'JK') {
          return original;
        } else {
          return {
            type: 'card',
            card: {
              ...original.card,
              ...action.cardSpec,
            },
          };
        }
      } else {
        return original;
      }
    case GameActions.FriendSelect.CHANGE_PLAYER:
      if (original.type === 'player') {
        return {
          type: 'player',
          player: action.player,
        };
      } else {
        return original;
      }
    case GameActions.FriendSelect.CHANGE_ROUND:
      if (original.type === 'round') {
        return {
          type: 'round',
          round: action.round,
        };
      } else {
        return original;
      }
  }
}

function getPlayerUsernames(room: WebSocket.Data.Room) {
  return room.players.map(player => player.username);
}

const initialState: GameState = {
  type: 'not-in-room',
};

function applyPlayerState(
  room: WebSocket.Data.Room,
  update: GameActions.PlayerState
) {
  if (update.left) {
    const players = room.players.filter(p => p.username !== update.username);
    return {
      ...room,
      players,
    };
  }
  const players = room.players.map(p => {
    if (p.username === update.username) {
      return {
        ...p,
        ready: update.ready,
      };
    }
    return p;
  });
  if (!players.find(p => p.username === update.username)) {
    players.push({
      username: update.username,
      ready: update.ready,
    });
  }
  return {
    ...room,
    players,
  };
}

export function gameReducer(
  state: GameState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case GameActions.JOIN_ROOM:
      return { type: 'joining', to: action.payload.roomId };
    case GameActions.JOIN_ROOM_FAILED:
      return initialState;
    case GameActions.LEAVE_ROOM:
      return { type: 'leaving' };
    case GameActions.LEAVE_ROOM_DONE:
      return initialState;
    case GameActions.ROOM_INFO:
      return { type: 'not-started', room: action.room };
    case GameActions.PLAYER_STATE_CHANGE:
      if (state.type !== 'not-started') {
        console.error('PLAYER_STATE_CHANGE received outside room.');
        return state;
      }
      return { ...state, room: applyPlayerState(state.room, action.payload) };
    case GameActions.RESET_ROOM:
      if (state.type !== 'started') {
        console.error('RESET_ROOM received, but game haven\'t started');
        return state;
      }
      return {
        type: 'not-started',
        room: {
          ...state.room,
          players: action.players,
        },
      };
    case GameActions.STARTED:
      if (state.type !== 'not-started') {
        console.error('STARTED received outside room.');
        return state;
      }
      return {
        type: 'started',
        hand: [],
        room: state.room,
        turnOf: state.room.players[0].username,
        state: {
          type: 'bidding',
          bidHistory: [],
        },
      };
    case GameActions.DEAL:
      if (state.type !== 'started') {
        console.error('DEAL received, but game haven\'t started');
        return state;
      }
      return {
        ...state,
        hand: action.cards,
      };
    case GameActions.BIDDING:
      if (state.type !== 'started') {
        console.error('BIDDING received, but game haven\'t started');
        return state;
      }
      return {
        ...state,
        turnOf: action.player,
      };
    case GameActions.BID_EVENT:
      if (state.type !== 'started') {
        console.error('BIDDING received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'bidding') {
        console.error('BIDDING received, but game state is not in bidding');
        return state;
      }
      return {
        ...state,
        state: {
          ...state.state,
          bidHistory: [...state.state.bidHistory, action.bid],
        },
      };
    case GameActions.PRESIDENT_ELECTED:
      if (state.type !== 'started') {
        console.error('PRESIDENT_ELECTED received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'bidding') {
        console.error('PRESIDENT_ELECTED received, but game state is not in bidding');
        return state;
      }
      return {
        ...state,
        turnOf: '',
        state: {
          type: 'elected',
          result: action.result,
          friendDecl: null,
          selectedCards: null,
          error: null,
        },
      };
    case GameActions.FLOOR_CARDS:
      if (state.type !== 'started') {
        console.error('FLOOR_CARDS received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('FLOOR_CARDS received, but game state is not in elected');
        return state;
      }
      return {
        ...state,
        hand: [...state.hand, ...action.cards],
      };
    case GameActions.FRIEND_SELECTING:
      if (state.type !== 'started') {
        console.error('FRIEND_SELECTING received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('FRIEND_SELECTING received, but game state is not in elected');
        return state;
      }
      return {
        ...state,
        turnOf: action.player,
        state: {
          ...state.state,
          friendDecl: recommendFriend(state.hand, state.state.result.giruda),
          selectedCards: [],
        },
      };
    case GameActions.SELECT_CARD: {
      if (state.type !== 'started') {
        console.error('SELECT_CARD received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('SELECT_CARD received, but game state is not in elected');
        return state;
      }
      const selectedCards = state.state.selectedCards.filter(x => x !== action.card);
      if (selectedCards.length === state.state.selectedCards.length) {
        selectedCards.push(action.card);
      }
      return {
        ...state,
        state: {
          ...state.state,
          selectedCards,
        },
      };
    }
    case GameActions.FriendSelect.CHANGE_TYPE:
    case GameActions.FriendSelect.TOGGLE_JOKER:
    case GameActions.FriendSelect.CHANGE_CARD:
    case GameActions.FriendSelect.CHANGE_PLAYER:
    case GameActions.FriendSelect.CHANGE_ROUND:
      if (state.type !== 'started') {
        console.error('FriendSelect actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('FriendSelect actions received, but game state is not in elected');
        return state;
      }
      return {
        ...state,
        state: {
          ...state.state,
          friendDecl: updateFriendDecl(
            state.state.friendDecl,
            action,
            state.hand,
            state.state.result.giruda
          ),
        },
      };
    case GameActions.FriendSelect.CONFIRM:
      if (state.type !== 'started') {
        console.error('FriendSelect actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('FriendSelect actions received, but game state is not in elected');
        return state;
      }
      return {
        ...state,
        state: {
          ...state.state,
          error: null,
        },
      };
    case GameActions.FriendSelect.FAILED:
      if (state.type !== 'started') {
        console.error('FriendSelect actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('FriendSelect actions received, but game state is not in elected');
        return state;
      }
      return {
        ...state,
        state: {
          ...state.state,
          error: action.error,
        },
      };
    case GameActions.FRIEND_SELECT_EVENT: {
      if (state.type !== 'started') {
        console.error('FriendSelect actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'elected') {
        console.error('FriendSelect actions received, but game state is not in elected');
        return state;
      }
      const discardedCards = state.state.selectedCards;
      const hand = state.hand.filter(x => !discardedCards.includes(x));
      const bid =
        'change_bid' in action.payload ?
        action.payload.change_bid :
        { score: state.state.result.score, giruda: state.state.result.giruda };
      let friendDecl: WebSocket.Data.Friend = { type: 'no' };
      switch (action.payload.type) {
        case 'no':
          friendDecl = { type: 'no' };
          break;
        case 'card':
          friendDecl = { type: 'card', card: action.payload.card };
          break;
        case 'player':
          friendDecl = { type: 'player', player: action.payload.player };
          break;
        case 'round':
          friendDecl = { type: 'round', round: action.payload.round };
          break;
      }
      const scoreCards = {};
      for (const player of state.room.players) {
        scoreCards[player.username] = [];
      }
      return {
        ...state,
        hand,
        turnOf: '',
        state: {
          type: 'playing',
          bid,
          president: state.state.result.username,
          friend: null,
          friendDecl,
          cards: {},
          scoreCards,
        },
      };
    }
    case GameActions.TURN_EVENT:
      if (state.type !== 'started') {
        console.error('TURN_EVENT actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'playing') {
        console.error('TURN_EVENT actions received, but game state is not in playing');
        return state;
      }
      return {
        ...state,
        turnOf: action.player,
      };
    case GameActions.PLAY_CARD_DONE:
      if (state.type !== 'started') {
        console.error('PLAY_CARD_DONE action received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'playing') {
        console.error('PLAY_CARD_DONE action received, but game state is not in playing');
        return state;
      }
      return {
        ...state,
        hand: state.hand.filter(x => {
          if (x.rank === 'JK' && action.card.rank === 'JK') {
            return false;
          }
          return !(x.rank === action.card.rank && x.suit === action.card.suit);
        }),
      };
    case GameActions.PLAY_CARD_EVENT:
      if (state.type !== 'started') {
        console.error('PLAY_CARD_EVENT actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'playing') {
        console.error('PLAY_CARD_EVENT actions received, but game state is not in playing');
        return state;
      }
      return {
        ...state,
        turnOf: '',
        state: {
          ...state.state,
          cards: {
            ...state.state.cards,
            [action.player]: action.card,
          },
        },
      };
    case GameActions.ROUND_END:
      if (state.type !== 'started') {
        console.error('ROUND_END actions received, but game haven\'t started');
        return state;
      }
      if (state.state.type !== 'playing') {
        console.error('ROUND_END actions received, but game state is not in playing');
        return state;
      }
      return {
        ...state,
        state: {
          ...state.state,
          cards: {},
          scoreCards: {
            ...state.state.scoreCards,
            [action.player]: [...state.state.scoreCards[action.player], ...action.scoreCards],
          },
        },
      };
    case WebSocketActions.DISCONNECTED:
    case WebSocketActions.DUPLICATE_SESSION:
      return initialState;
    default:
      return state;
  }
}
