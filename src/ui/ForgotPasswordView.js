export class ForgotPasswordView extends HTMLElement {
    #auth = null;
    set auth(value) { this.#auth = value; this.#render(); }

    #render() {
        this.innerHTML = `
          <header class="head">
            <span class="eyebrow">Восстановление</span>
            <h1>Сброс пароля</h1>
            <p>Введите email, указанный при регистрации.</p>
          </header>
          <form class="form">
            <div class="field">
              <label>Email</label>
              <div class="control"><input name="email" type="email" required /></div>
            </div>
            <p class="form-error" data-error></p>
            <button class="submit" type="submit">Отправить ссылку</button>
            <p class="foot"><a href="#/login" data-nav>Назад ко входу</a></p>
          </form>
        `;

        this.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = new FormData(e.target).get('email');
            try {
                await this.#auth.requestPasswordReset(email);
                this.querySelector('[data-error]').textContent =
                    'Если аккаунт существует и подтверждён, письмо отправлено.';
                this.querySelector('[data-error]').classList.add('note');
            } catch (err) {
                this.querySelector('[data-error]').textContent = err.message;
            }
        });
    }
}
customElements.define('forgot-password-view', ForgotPasswordView);