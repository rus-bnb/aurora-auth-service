import { Repository } from '../db/Repository.js';

export class VerificationRepository extends Repository {
    constructor(db) { super(db, 'verifications'); }

    findByUser(userId) {
        return this.findOneByIndex('byUserId', userId);
    }

    async deleteExpired(now = Date.now()) {
        const all = await this.findAll();
        const expired = all.filter((v) => v.expiresAt < now);
        await Promise.all(expired.map((v) => this.remove(v.token)));
    }
}