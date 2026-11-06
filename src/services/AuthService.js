import { hashPassword, verifyPassword } from '../utils/password.js';
import { uuid } from '../utils/id.js';
import { AuthError } from './errors.js';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_TTL   = 24 * 60 * 60 * 1000; // 24 часа

export class AuthService {
    #userRepo;
    #sessionRepo;
    #verificationRepo;
    #passwordResetRepo;
    #emailService;
    #currentUser = null;

    constructor({ userRepo, sessionRepo, verificationRepo, passwordResetRepo, emailService }) {
        this.#userRepo          = userRepo;
        this.#sessionRepo       = sessionRepo;
        this.#verificationRepo  = verificationRepo;
        this.#passwordResetRepo = passwordResetRepo;
        this.#emailService      = emailService;
    }

    get currentUser() { return this.#currentUser; }

    async register({ name, email, password }) {
        if (!email || !password) throw new AuthError('Заполните все поля');

        const exists = await this.#userRepo.findByEmail(email);
        if (exists) throw new AuthError('Аккаунт с таким email уже существует');

        const user = {
            id: uuid(),
            name: name?.trim() || email,
            email: email.toLowerCase(),
            passwordHash: await hashPassword(password),
            emailVerified: false,
            createdAt: Date.now(),
        };

        await this.#userRepo.add(user);
        await this.#sendVerification(user);

        await this.#sessionRepo.save({
            userId: user.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + THIRTY_DAYS,
        });

        this.#currentUser = this.#publicView(user);
        return this.#currentUser;
    }

    async login({ email, password, remember = false }) {
        const user = await this.#userRepo.findByEmail(email);
        if (!user) throw new AuthError('Неверный email или пароль');

        if (!(await verifyPassword(password, user.passwordHash))) {
            throw new AuthError('Неверный email или пароль');
        }

        if (remember) {
            await this.#sessionRepo.save({
                userId: user.id,
                createdAt: Date.now(),
                expiresAt: Date.now() + THIRTY_DAYS,
            });
        }

        this.#currentUser = this.#publicView(user);
        return this.#currentUser;
    }

    async logout() {
        if (this.#currentUser) {
            try { await this.#sessionRepo.remove(this.#currentUser.id); } catch { /* ignore */ }
        }
        this.#currentUser = null;
    }

    async restoreSession() {
        const sessions = await this.#sessionRepo.findAll();
        const now = Date.now();

        let latest = null;
        for (const s of sessions) {
            if (s.expiresAt && s.expiresAt < now) {
                await this.#sessionRepo.remove(s.userId);
                continue;
            }
            if (!latest || s.createdAt >= latest.createdAt) latest = s;
        }
        if (!latest) return null;

        const user = await this.#userRepo.findById(latest.userId);
        if (!user) {
            await this.#sessionRepo.remove(latest.userId);
            return null;
        }
        this.#currentUser = this.#publicView(user);
        return this.#currentUser;
    }

    // ---- верификация email -------------------------------------------------

    async #sendVerification(user) {
        const existing = await this.#verificationRepo.findByUser(user.id);
        if (existing) await this.#verificationRepo.remove(existing.token);

        const token = uuid();
        await this.#verificationRepo.add({
            token,
            userId: user.id,
            expiresAt: Date.now() + TOKEN_TTL,
        });

        const link = `${location.origin}${location.pathname}#/verify?token=${token}`;

        await this.#emailService.sendVerification({
            email: user.email,
            name: user.name,
            link,
        });
    }

    async verifyEmail(token) {
        const record = await this.#verificationRepo.findById(token);
        if (!record) throw new AuthError('Ссылка недействительна или истекла');
        if (record.expiresAt < Date.now()) {
            await this.#verificationRepo.remove(token);
            throw new AuthError('Срок действия ссылки истёк');
        }

        const user = await this.#userRepo.findById(record.userId);
        if (!user) throw new AuthError('Пользователь не найден');

        user.emailVerified = true;
        await this.#userRepo.save(user);
        await this.#verificationRepo.remove(token);

        if (this.#currentUser?.id === user.id) {
            this.#currentUser = this.#publicView(user);
        }
        return this.#currentUser;
    }

    async resendVerification() {
        if (!this.#currentUser) throw new AuthError('Требуется вход');
        const user = await this.#userRepo.findById(this.#currentUser.id);
        if (!user) throw new AuthError('Пользователь не найден');
        if (user.emailVerified) throw new AuthError('Email уже подтверждён');
        await this.#sendVerification(user);
    }

    // ---- сброс пароля ------------------------------------------------------

    async requestPasswordReset(email) {
        const user = await this.#userRepo.findByEmail(email);
        if (!user) {
            // не раскрываем факт существования аккаунта
            return;
        }
        if (!user.emailVerified) {
            throw new AuthError('Сначала подтвердите email — восстановление пароля недоступно');
        }

        const existing = await this.#passwordResetRepo.findByUser(user.id);
        if (existing) await this.#passwordResetRepo.remove(existing.token);

        const token = uuid();
        await this.#passwordResetRepo.add({
            token,
            userId: user.id,
            expiresAt: Date.now() + TOKEN_TTL,
        });

        const link = `${location.origin}${location.pathname}#/reset-password?token=${token}`;

        await this.#emailService.sendPasswordReset({
            email: user.email,
            name: user.name,
            link,
        });
    }

    async resetPassword(token, newPassword) {
        const record = await this.#passwordResetRepo.findById(token);
        if (!record) throw new AuthError('Ссылка недействительна или истекла');
        if (record.expiresAt < Date.now()) {
            await this.#passwordResetRepo.remove(token);
            throw new AuthError('Срок действия ссылки истёк');
        }

        const user = await this.#userRepo.findById(record.userId);
        if (!user) throw new AuthError('Пользователь не найден');

        user.passwordHash = await hashPassword(newPassword);
        await this.#userRepo.save(user);
        await this.#passwordResetRepo.remove(token);
        await this.#sessionRepo.remove(user.id); // разлогинить везде
    }

    // ---- профиль -----------------------------------------------------------

    async updateProfile(userId, { name, email }) {
        const user = await this.#userRepo.findById(userId);
        if (!user) throw new AuthError('Пользователь не найден');

        const nextEmail = email ? email.toLowerCase() : user.email;
        const emailChanged = nextEmail !== user.email;

        if (emailChanged) {
            const exists = await this.#userRepo.findByEmail(nextEmail);
            if (exists) throw new AuthError('Этот email уже занят');
            user.email = nextEmail;
            user.emailVerified = false;
        }
        if (name != null) user.name = name.trim() || user.name;

        await this.#userRepo.save(user);

        if (emailChanged) {
            await this.#sendVerification(user);
        }

        if (this.#currentUser?.id === user.id) {
            this.#currentUser = this.#publicView(user);
        }
        return this.#currentUser;
    }

    #publicView({ passwordHash, ...safe }) { return safe; }
}