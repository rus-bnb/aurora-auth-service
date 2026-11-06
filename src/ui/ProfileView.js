const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

export class ProfileView extends HTMLElement {
    #user = null;
    #auth = null;

    set data({ user, auth }) {
        this.#user = user;
        this.#auth = auth;
        this.#render();
    }

    #render() {
        const u = this.#user;
        const name = escapeHtml(u.name || u.email);
        const email = escapeHtml(u.email);
        const initial = String(u.name || u.email).trim()[0]?.toUpperCase() || '?';

        this.innerHTML = `
          <header class="head">
            <span class="eyebrow">Личный кабинет</span>
            <h1>Профиль</h1>
            <p>${u.emailVerified
                ? 'Email подтверждён'
                : '<span class="status-warn">Email не подтверждён — восстановление пароля недоступно</span>'}</p>
          </header>

          <form class="form" id="profile-form">
            <div class="field">
              <label>Имя</label>
              <div class="control"><input name="name" value="${name}" /></div>
            </div>
            <div class="field">
              <label>Email</label>
              <div class="control"><input name="email" type="email" value="${email}" /></div>
            </div>

            <p class="form-error" data-error></p>

            <button class="submit" type="submit">
              <span class="submit-label">Сохранить</span>
            </button>

            ${!u.emailVerified
                ? `<button type="button" class="mini-link" data-resend>Отправить письмо повторно</button>`
                : ''}

            <p class="foot">
              <a href="#/forgot" data-nav>Сменить пароль</a>
              &nbsp;·&nbsp;
              <a href="#" data-logout>Выйти</a>
            </p>
          </form>
        `;

        this.querySelector('#profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const errEl = this.querySelector('[data-error]');
            errEl.classList.remove('show', 'note');
            errEl.textContent = '';

            try {
                await this.#auth.updateProfile(u.id, {
                    name: fd.get('name'),
                    email: fd.get('email'),
                });
                this.dispatchEvent(new CustomEvent('profile:updated', {
                    detail: { user: this.#auth.currentUser },
                    bubbles: true,
                    composed: true,
                }));
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.add('show');
            }
        });

        this.querySelector('[data-resend]')?.addEventListener('click', async () => {
            const errEl = this.querySelector('[data-error]');
            errEl.classList.remove('show');
            try {
                await this.#auth.resendVerification();
                errEl.textContent = 'Письмо отправлено повторно';
                errEl.classList.add('show', 'note');
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.add('show');
            }
        });

        this.querySelector('[data-logout]').addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('auth:logout', {
                bubbles: true,
                composed: true,
            }));
        });
    }
}

customElements.define('profile-view', ProfileView);