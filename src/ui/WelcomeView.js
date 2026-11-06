const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

export class WelcomeView extends HTMLElement {
    #user = null;

    set user(value) {
        this.#user = value;
        this.#render();
    }
    get user() { return this.#user; }

    #render() {
        if (!this.#user) return;
        const name = this.#user.name || this.#user.email;
        const email = this.#user.email;
        const initial = String(name).trim()[0]?.toUpperCase() || '?';

        this.innerHTML = `
      <div class="welcome">
        <div class="welcome-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
        <h1>С возвращением, ${escapeHtml(name)}</h1>
        <p>Вы вошли как ${escapeHtml(email)}</p>
        <button class="submit" type="button" data-logout>
          <span class="submit-label">Выйти</span>
        </button>
      </div>
    `;

        this.querySelector('[data-logout]').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('auth:logout', {
                bubbles: true,
                composed: true,
            }));
        });
    }
}

customElements.define('welcome-view', WelcomeView);