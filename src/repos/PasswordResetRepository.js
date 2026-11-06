import { Repository } from '../db/Repository.js';

export class PasswordResetRepository extends Repository {
    constructor(db) { super(db, 'passwordResets'); }

    findByUser(userId) {
        return this.findOneByIndex('byUserId', userId);
    }
}