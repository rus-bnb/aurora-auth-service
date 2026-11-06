export class ResetPasswordView extends HTMLElement {
    #auth = null;
    #token = null;

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
          </header>
          <form class="form">
            <div class="field">
              <label>Новый пароль</label>
              <div class="control"><input name="password" type="password" required minlength="8" /></div>
            </div>
            <div class="field">
              <label>Повторите пароль</label>
              <div class="control"><input name="confirm" type="password" required /></div>
            </div>
            <p class="form-error" data-error></p>
            <button class="submit" type="submit">Сохранить пароль</button>
          </form>
        `;

        this.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            if (fd.get('password') !== fd.get('confirm')) {
                this.querySelector('[data-error]').textContent = 'Пароли не совпадают';
                return;
            }
            try {
                await this.#auth.resetPassword(this.#token, fd.get('password'));
                this.querySelector('[data-error]').textContent = 'Пароль обновлён. Войдите заново.';
                this.querySelector('[data-error]').classList.add('note');
                setTimeout(() => { location.hash = '#/login'; }, 1500);
            } catch (err) {
                this.querySelector('[data-error]').textContent = err.message;
            }
        });
    }
}
customElements.define('reset-password-view', ResetPasswordView);