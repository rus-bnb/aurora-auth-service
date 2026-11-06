import { Repository } from '../db/Repository.js';

export class UserRepository extends Repository {
    constructor(db) { super(db, 'users'); }
    findByEmail(email) { return this.findOneByIndex('byEmail', email.toLowerCase()); }
}