export class User {
  username: string;
  id: number;
}

export class Profile {
  user: User;
  nickname: string;
  gamesTotal: number;
  gamesWon: number;
  ranking: number;
}
