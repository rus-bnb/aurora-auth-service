export class VerifyEmailView extends HTMLElement {
    #auth = null;
    #token = null;

    set data({ auth, token }) {
        this.#auth = auth;
        this.#token = token;
        this.#render();
        this.#verify();
    }

    #render() {
        this.innerHTML = `
          <div class="welcome">
            <h1>Подтверждение email</h1>
            <p data-status>Проверяем ссылку…</p>
            <p class="form-error" data-error></p>
          </div>
        `;
    }

    async #verify() {
        try {
            await this.#auth.verifyEmail(this.#token);
            this.querySelector('[data-status]').textContent = 'Email успешно подтверждён!';
            setTimeout(() => { location.hash = '#/profile'; }, 1200);
        } catch (err) {
            this.querySelector('[data-error]').textContent = err.message;
        }
    }
}
customElements.define('verify-email-view', VerifyEmailView);