import { Repository } from '../db/Repository.js';

export class SessionRepository extends Repository {
  constructor(db) { super(db, 'sessions'); }
}