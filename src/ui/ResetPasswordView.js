import { ICONS } from './icons.js';

const STRENGTH_LABELS = ['', 'Слабый', 'Средний', 'Хороший', 'Надёжный'];
const MIN_LENGTH = 8;

export class ResetPasswordView extends HTMLElement {
    #auth = null;
    #token = null;
    #loading = false;

    set data({ auth, token }) {
        this.#auth = auth;
        this.#token = token;
        this.#render();
    }

    #render() {
        this.innerHTML = `
          <header class="head">
            <span class="eyebrow">Новый пароль</span>
            <h1>Сброс пароля</h1>
            <p>Придумайте новый пароль для входа в аккаунт.</p>
          </header>

          <form class="form" novalidate>
            <div class="field" data-field="password">
              <label for="rp-password">Новый пароль</label>
              <div class="control has-icon">
                <span class="icon">${ICONS.lock}</span>
                <input id="rp-password" name="password" type="password"
                       placeholder="Минимум ${MIN_LENGTH} символов"
                       autocomplete="new-password"
                       aria-describedby="rp-password-error" />
                <button type="button" class="toggle" data-toggle
                        aria-label="Показать пароль" aria-pressed="false">${ICONS.eye}</button>
              </div>
              <div class="strength" data-strength data-level="0" aria-hidden="true">
                <i></i><i></i><i></i><i></i>
              </div>
              <p class="strength-label" data-strength-label aria-live="polite"></p>
              <p class="error" id="rp-password-error" data-error></p>
            </div>

            <div class="field" data-field="confirm">
              <label for="rp-confirm">Повторите пароль</label>
              <div class="control has-icon">
                <span class="icon">${ICONS.lock}</span>
                <input id="rp-confirm" name="confirm" type="password"
                       placeholder="Ещё раз" autocomplete="new-password"
                       aria-describedby="rp-confirm-error" />
                <button type="button" class="toggle" data-toggle
                        aria-label="Показать пароль" aria-pressed="false">${ICONS.eye}</button>
              </div>
              <p class="error" id="rp-confirm-error" data-error></p>
            </div>

            <p class="form-error" data-form-error role="alert"></p>

            <button class="submit" type="submit">
              <span class="spinner" aria-hidden="true"></span>
              <span class="submit-label">Сохранить пароль</span>
            </button>

            <p class="note" data-note role="status"></p>
            <p class="foot"><a href="#/login" data-nav>Назад ко входу</a></p>
          </form>
        `;

        this.#bind();
    }

    #bind() {
        const form         = this.querySelector('form');
        const passwordInput = this.querySelector('input[name="password"]');
        const confirmInput  = this.querySelector('input[name="confirm"]');

        form.addEventListener('submit', (e) => this.#onSubmit(e));

        passwordInput.addEventListener('input', () => {
            this.#updateStrength(passwordInput.value);
            this.#validatePassword(false);
            if (confirmInput.value) this.#validateConfirm(false);
        });

        confirmInput.addEventListener('input', () => this.#validateConfirm(false));
        confirmInput.addEventListener('blur', () => this.#validateConfirm(true));

        this.querySelectorAll('[data-toggle]').forEach((btn) => {
            btn.addEventListener('click', () => this.#togglePassword(btn));
        });

        this.querySelectorAll('[data-nav]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('navigate', {
                    detail: { to: a.dataset.nav.replace(/^#\//, '') },
                    bubbles: true, composed: true,
                }));
            });
        });
    }

    // ---- валидация ---------------------------------------------------------

    #validatePassword(showEmptyError = true) {
        const input = this.querySelector('input[name="password"]');
        const wrap  = this.querySelector('[data-field="password"]');
        const value = input.value;

        let error = '';
        if (!value) {
            if (showEmptyError) error = 'Придумайте пароль';
        } else if (value.length < MIN_LENGTH) {
            error = `Минимум ${MIN_LENGTH} символов`;
        }

        this.#setError(wrap, error);
        return !error && value.length > 0;
    }

    #validateConfirm(showEmptyError = false) {
        const password = this.querySelector('input[name="password"]').value;
        const input    = this.querySelector('input[name="confirm"]');
        const wrap     = this.querySelector('[data-field="confirm"]');
        const value    = input.value;

        let error = '';
        if (!value) {
            if (showEmptyError) error = 'Повторите пароль';
        } else if (value !== password) {
            error = 'Пароли не совпадают';
        }

        this.#setError(wrap, error);
        return !error && value.length > 0;
    }

    // ---- helpers -----------------------------------------------------------

    #setError(wrap, message) {
        if (!wrap) return;
        const errEl = wrap.querySelector('[data-error]');
        const input = wrap.querySelector('input');
        if (message) {
            wrap.classList.add('is-invalid');
            if (errEl) errEl.textContent = message;
            if (input) input.setAttribute('aria-invalid', 'true');
        } else {
            wrap.classList.remove('is-invalid');
            if (errEl) errEl.textContent = '';
            if (input) input.removeAttribute('aria-invalid');
        }
    }

    #formError(message = '') {
        const el = this.querySelector('[data-form-error]');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('show', Boolean(message));
    }

    #setNote(message = '') {
        const el = this.querySelector('[data-note]');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('show', Boolean(message));
    }

    #setLoading(on) {
        this.#loading = on;
        const btn = this.querySelector('.submit');
        if (!btn) return;
        btn.disabled = on;
        btn.classList.toggle('is-loading', on);
    }

    #togglePassword(btn) {
        const input = btn.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? ICONS.eyeOff : ICONS.eye;
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
        input.focus({ preventScroll: true });
    }

    #updateStrength(value) {
        const meter = this.querySelector('[data-strength]');
        const label = this.querySelector('[data-strength-label]');

        let score = 0;
        if (value.length >= 8) score++;
        if (value.length >= 12) score++;
        if (/[A-ZА-ЯЁ]/.test(value) && /[a-zа-яё]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[^\p{L}\p{N}\s]/u.test(value)) score++;
        score = Math.min(score, 4);
        if (!value) score = 0;

        meter.dataset.level = String(score);
        label.textContent = value ? STRENGTH_LABELS[score] : '';
    }

    // ---- submit ------------------------------------------------------------

    async #onSubmit(e) {
        e.preventDefault();
        if (this.#loading) return;

        this.#formError('');
        this.#setNote('');

        const okPass = this.#validatePassword(true);
        const okConf = this.#validateConfirm(true);

        if (!okPass || !okConf) {
            this.#formError('Проверьте поля выше');
            this.querySelector('.field.is-invalid input')?.focus();
            return;
        }

        const password = this.querySelector('input[name="password"]').value;

        this.#setLoading(true);
        try {
            await this.#auth.resetPassword(this.#token, password);

            this.querySelectorAll('input, button.submit, [data-toggle]').forEach((el) => {
                el.disabled = true;
            });
            this.#setNote('Пароль обновлён. Сейчас перенаправим на страницу входа…');

            setTimeout(() => { location.hash = '#/login'; }, 1800);
        } catch (err) {
            this.#formError(err.message || 'Не удалось обновить пароль');

            if (/истек|недействительн/i.test(err.message || '')) {
                this.#setNote('Ссылка недействительна. Запросите новую через «Забыли пароль?» на странице входа.');
            }
        } finally {
            this.#setLoading(false);
        }
    }
}

customElements.define('reset-password-view', ResetPasswordView);