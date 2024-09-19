import { User, Profile } from './user.model';
import { User as User2, Profile as Profile2 } from './user2.model';
import { User as User3, Profile as Profile3 } from './user3.model';

export const SHARD_MAP = [
  { rangeStart: 1, rangeEnd: 100, dbFile: 'shard1.sqlite' },
  { rangeStart: 101, rangeEnd: 200, dbFile: 'shard2.sqlite' },
  { rangeStart: 201, rangeEnd: 300, dbFile: 'shard3.sqlite' },
];

export function generateShardId(key: string): number {
  // Simple hash function based on character codes
  const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Return a shardId between 1 and 3
  return (hash % 3) + 1;
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
