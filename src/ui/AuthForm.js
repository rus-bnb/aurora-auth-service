import { ICONS } from './icons.js';
import { validateField } from '../utils/validation.js';

const STRENGTH_LABELS = ['', 'Слабый', 'Средний', 'Хороший', 'Надёжный'];

export class AuthForm extends HTMLElement {
    #schema = null;
    #rendered = false;
    #loading = false;

    set schema(value) {
        this.#schema = value;
        this.#render();
    }
    get schema() { return this.#schema; }

    connectedCallback() {
        if (this.#schema && !this.#rendered) this.#render();
    }

    #render() {
        if (!this.#schema) return;
        const s = this.#schema;
        this.#rendered = true;

        this.innerHTML = `
      <header class="head">
        ${s.eyebrow ? `<span class="eyebrow">${s.eyebrow}</span>` : ''}
        <h1>${s.title}</h1>
        <p>${s.subtitle}</p>
      </header>

      <form class="form" novalidate autocomplete="on">
        ${s.fields.map((f) => this.#renderField(f)).join('')}
        <p class="form-error" data-form-error role="alert"></p>
        <button class="submit" type="submit">
          <span class="spinner" aria-hidden="true"></span>
          <span class="submit-label">${s.submit}</span>
        </button>
        <p class="note" data-note role="status"></p>
        ${s.footer
                ? `<p class="foot">${s.footer.text}
               <a href="#/${s.footer.to}" data-nav="${s.footer.to}">${s.footer.linkText}</a>
             </p>`
                : ''}
      </form>
    `;

        this.#bind();
    }

    /* ------------------------------------------------------------------
     * Рендер одного поля. Раньше жил в pages.js, но нужен только здесь —
     * поэтому приватный метод, а не shared-утилита.
     * ---------------------------------------------------------------- */
    #renderField(field) {
        const id = `f-${field.name}`;
        const errId = `e-${field.name}`;

        if (field.type === 'checkbox') {
            return `
        <div class="field field--check" data-field="${field.name}">
          <label class="checkbox" for="${id}">
            <input type="checkbox" id="${id}" name="${field.name}" aria-describedby="${errId}" />
            <span class="box" aria-hidden="true">${ICONS.check}</span>
            <span>${field.label}</span>
          </label>
          <p class="error" id="${errId}" data-error></p>
        </div>`;
        }

        const isPassword = field.type === 'password';

        return `
      <div class="field" data-field="${field.name}">
        <div class="field-head">
          <label for="${id}">${field.label}</label>
          ${field.action
                ? `<button type="button" class="mini-link" data-action="${field.action.action}">
                 ${field.action.label}
               </button>`
                : ''}
        </div>
        <div class="control${field.icon ? ' has-icon' : ''}">
          ${field.icon ? `<span class="icon">${ICONS[field.icon]}</span>` : ''}
          <input
            id="${id}" name="${field.name}" type="${field.type}"
            placeholder="${field.placeholder || ''}"
            autocomplete="${field.autocomplete || 'off'}"
            ${field.inputmode ? `inputmode="${field.inputmode}"` : ''}
            aria-describedby="${errId}"
          />
          ${isPassword
                ? `<button type="button" class="toggle" data-toggle
                       aria-label="Показать пароль" aria-pressed="false">
                 ${ICONS.eye}
               </button>`
                : ''}
        </div>
        ${field.strength
                ? `<div class="strength" data-strength data-level="0" aria-hidden="true">
               <i></i><i></i><i></i><i></i>
             </div>
             <p class="strength-label" data-strength-label aria-live="polite"></p>`
                : ''}
        <p class="error" id="${errId}" data-error></p>
      </div>`;
    }

    #bind() {
        const form = this.querySelector('form');
        form.addEventListener('submit', (e) => this.#onSubmit(e));
        form.addEventListener('input', (e) => this.#onInput(e));
        form.addEventListener('focusout', (e) => this.#onBlur(e));

        this.querySelectorAll('[data-toggle]').forEach((btn) =>
            btn.addEventListener('click', () => this.#togglePassword(btn)));

        this.querySelectorAll('[data-nav]').forEach((link) =>
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('navigate', {
                    detail: { to: link.dataset.nav },
                    bubbles: true, composed: true,
                }));
            }));

        this.querySelectorAll('[data-action]').forEach((btn) =>
            btn.addEventListener('click', () => this.#runAction(btn.dataset.action)));
    }

    #values() {
        const out = {};
        this.querySelectorAll('input[name]').forEach((input) => {
            out[input.name] = input.type === 'checkbox' ? input.checked : input.value;
        });
        return out;
    }

    #fieldOf(input) { return input.closest('.field'); }
    #fieldSchema(name) { return this.#schema.fields.find((f) => f.name === name); }

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

    #onInput(e) {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        const wrap = this.#fieldOf(input);
        const field = this.#fieldSchema(input.name);
        if (!wrap || !field) return;

        if (wrap.classList.contains('is-invalid')) {
            const value = input.type === 'checkbox' ? input.checked : input.value;
            this.#setError(wrap, validateField(field, value, this.#values()));
        }

        if (field.strength) this.#updateStrength(wrap, input.value);

        if (input.name === 'password') {
            const confirmWrap = this.querySelector('[data-field="passwordConfirm"]');
            const confirmField = this.#fieldSchema('passwordConfirm');
            if (confirmWrap?.classList.contains('is-invalid') && confirmField) {
                const values = this.#values();
                this.#setError(confirmWrap, validateField(confirmField, values.passwordConfirm, values));
            }
        }

        this.#formError('');
    }

    #onBlur(e) {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        const wrap = this.#fieldOf(input);
        const field = this.#fieldSchema(input.name);
        if (!wrap || !field) return;

        const value = input.type === 'checkbox' ? input.checked : input.value;
        if (!String(value).trim() && !wrap.classList.contains('is-invalid')) return;

        this.#setError(wrap, validateField(field, value, this.#values()));
    }

    #updateStrength(wrap, value) {
        const meter = wrap.querySelector('[data-strength]');
        const label = wrap.querySelector('[data-strength-label]');
        if (!meter) return;

        let score = 0;
        if (value.length >= 8) score++;
        if (value.length >= 12) score++;
        if (/[A-ZА-ЯЁ]/.test(value) && /[a-zа-яё]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[^\p{L}\p{N}\s]/u.test(value)) score++;
        score = Math.min(score, 4);
        if (!value) score = 0;

        meter.dataset.level = String(score);
        if (label) label.textContent = value ? STRENGTH_LABELS[score] : '';
    }

    #runAction(action) {
    if (action === 'forgot') {
            const email = this.querySelector('input[name="email"]')?.value.trim() || '';

        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { to: 'forgot', prefill: { email } },
            bubbles: true,
            composed: true,
        }));
    }
}

    async #onSubmit(e) {
        e.preventDefault();
        if (this.#loading) return;

        this.#formError('');
        this.#setNote('');

        const values = this.#values();
        let firstInvalid = null;

        for (const field of this.#schema.fields) {
            const wrap = this.querySelector(`[data-field="${field.name}"]`);
            if (!wrap) continue;
            const error = validateField(field, values[field.name], values);
            this.#setError(wrap, error);
            if (error && !firstInvalid) firstInvalid = wrap.querySelector('input');
        }

        if (firstInvalid) {
            firstInvalid.focus();
            this.#formError('Проверьте выделенные поля');
            return;
        }

        this.#setLoading(true);
        try {
            const user = await this.#schema.onSubmit(values);
            this.#setNote(this.#schema.successText || 'Готово!');
            this.dispatchEvent(new CustomEvent('auth:success', {
                detail: { user },
                bubbles: true,
                composed: true,
            }));
        } catch (err) {
            this.#formError(err?.message || 'Не удалось выполнить запрос');
        } finally {
            this.#setLoading(false);
        }
    }
}

customElements.define('auth-form', AuthForm);