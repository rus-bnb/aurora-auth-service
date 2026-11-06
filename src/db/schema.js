export const schema = {
    version: 2,                     // ← bump: добавлены новые stores
    stores: {
        users: {
            keyPath: 'id',
            autoIncrement: false,
            indexes: {
                byEmail: { keyPath: 'email', unique: true },
            },
        },
        sessions: {
            keyPath: 'userId',
            autoIncrement: false,
            indexes: {
                byCreatedAt: { keyPath: 'createdAt' },
            },
        },
        verifications: {
            keyPath: 'token',
            autoIncrement: false,
            indexes: {
                byUserId: { keyPath: 'userId' },
                byExpiresAt: { keyPath: 'expiresAt' },
            },
        },
        passwordResets: {
            keyPath: 'token',
            autoIncrement: false,
            indexes: {
                byUserId: { keyPath: 'userId' },
                byExpiresAt: { keyPath: 'expiresAt' },
            },
        },
    },
};