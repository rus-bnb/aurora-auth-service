export class ForgotPasswordView extends HTMLElement {
  #auth = null;

  set auth(value) { this.#auth = value; this.#render(); }

  set prefill(value) {
    const input = this.querySelector('input[name="email"]');
    if (input && value) input.value = value;
  }

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
      const errEl = this.querySelector('[data-error]');
      const email = new FormData(e.target).get('email');
      try {
        await this.#auth.requestPasswordReset(email);
        this.querySelector('[data-error]').textContent =
          'Если аккаунт существует и подтверждён, письмо отправлено.';
        errEl.classList.remove('form-error');
        errEl.classList.add('note', 'show');
      } catch (err) {
        errEl.textContent = err.message;
          errEl.classList.add('show');
      }

    });
  }
}
customElements.define('forgot-password-view', ForgotPasswordView);