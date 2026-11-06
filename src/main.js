import { Database }               from './db/Database.js';
import { schema as dbSchema }     from './db/schema.js';
import { UserRepository }         from './repos/UserRepository.js';
import { SessionRepository }      from './repos/SessionRepository.js';
import { VerificationRepository } from './repos/VerificationRepository.js';
import { PasswordResetRepository } from './repos/PasswordResetRepository.js';
import { AuthService }            from './services/AuthService.js';
import { EmailService }           from './services/EmailService.js';
import { buildPages }             from './ui/pages.js';

// регистрируем все web components
import './ui/AuthForm.js';
import './ui/WelcomeView.js';
import './ui/ProfileView.js';
import './ui/ForgotPasswordView.js';
import './ui/ResetPasswordView.js';
import './ui/VerifyEmailView.js';

// ---- 1. Composition root ------------------------------------------------
const db = new Database({ name: 'aurora-auth', schema: dbSchema });

const auth = new AuthService({
    userRepo:          new UserRepository(db),
    sessionRepo:       new SessionRepository(db),
    verificationRepo:  new VerificationRepository(db),
    passwordResetRepo: new PasswordResetRepository(db),
    emailService:      new EmailService(),
});

const pages = buildPages(auth);

// ---- 2. View management -------------------------------------------------
const view = document.getElementById('view');

function restartAnim() {
    view.classList.remove('anim');
    void view.offsetWidth;
    view.classList.add('anim');
}

function mountLogin(routeKey) {
    const page = pages[routeKey] ?? pages.login;
    document.title = `${page.title} — Aurora`;

    view.innerHTML = '';
    const form = document.createElement('auth-form');
    form.schema = page;
    view.appendChild(form);
    restartAnim();
}

function renderProfile() {
    const user = auth.currentUser;
    if (!user) return mountLogin('login');

    document.title = `Профиль — Aurora`;
    view.innerHTML = '';
    const el = document.createElement('profile-view');
    el.data = { user, auth };
    view.appendChild(el);
    restartAnim();
}

function renderSimple(tag, props, title) {
    if (title) document.title = `${title} — Aurora`;
    view.innerHTML = '';
    const el = document.createElement(tag);
    if (props) Object.assign(el, props);
    view.appendChild(el);
    restartAnim();
}

// ---- 3. Router ----------------------------------------------------------
function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { path: path || 'login', params: new URLSearchParams(query) };
}

function route() {
    const { path, params } = parseRoute();

    switch (path) {
        case 'profile':
            renderProfile();
            break;

        case 'forgot': {
            const prefill = pendingPrefill?.email || '';
            pendingPrefill = null;

            document.title = 'Восстановление пароля — Aurora';
            view.innerHTML = '';
            const el = document.createElement('forgot-password-view');
            el.auth = auth;
            el.prefill = prefill;
            view.appendChild(el);
            restartAnim();
            break;
        }

        case 'reset-password':
            renderSimple(
                'reset-password-view',
                { data: { auth, token: params.get('token') } },
                'Новый пароль',
            );
            break;

        case 'verify':
            renderSimple(
                'verify-email-view',
                { data: { auth, token: params.get('token') } },
                'Подтверждение email',
            );
            break;

        case 'register':
        case 'login':
        default:
            if (auth.currentUser) renderProfile();
            else mountLogin(path === 'register' ? 'register' : 'login');
    }
}

window.addEventListener('hashchange', route);

// ---- 4. Glue events -----------------------------------------------------
document.addEventListener('auth:success', () => {
    location.hash = '#/profile';
});

document.addEventListener('auth:logout', async () => {
    await auth.logout();
    location.hash = '#/login';
});

document.addEventListener('profile:updated', () => {
    renderProfile();
});

let pendingPrefill = null;

// ---- 4. Glue events -----------------------------------------------------
document.addEventListener('navigate', (e) => {
    const to = e.detail?.to;
    if (!to) return;
    const next = `#/${to}`;
    if (location.hash === next) route();
    else location.hash = next;
});

// ---- 5. Bootstrap -------------------------------------------------------
(async () => {
    const restored = await auth.restoreSession();
    if (restored) {
        if (location.hash !== '#/profile') location.hash = '#/profile';
        else renderProfile();
    } else {
        route();
    }
})();