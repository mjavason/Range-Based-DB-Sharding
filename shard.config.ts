import { User, Profile } from './user.model';
import { User as User2, Profile as Profile2 } from './user2.model';
import { User as User3, Profile as Profile3 } from './user3.model';

export const SHARD_MAP = [
  { rangeStart: 1, rangeEnd: 100, dbFile: 'shard1.sqlite' },
  { rangeStart: 101, rangeEnd: 200, dbFile: 'shard2.sqlite' },
  { rangeStart: 201, rangeEnd: 300, dbFile: 'shard3.sqlite' },
];

export function generateShardId(str: string) {
  let hash = 0;

  // Create a simple hash from the string
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map the hash to a number between 1 and 3
  let number = Math.abs(hash % 3) + 1;

  return number;
}

export function getSequelizeInstanceForId(shardId: number) {
  switch (shardId) {
    case 1:
      return { User, Profile };
    case 2:
      return { User: User2, Profile: Profile2 };
    case 3:
      return { User: User3, Profile: Profile3 };
    default:
      return { User, Profile };
  }
}
