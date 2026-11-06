const EMAILJS_SERVICE_ID = 'service_c23yjit';
const EMAILJS_PUBLIC_KEY = 'zY2oY6SyX-r5AgMmL';
const TEMPLATE_VERIFY    = 'template_u6hpt3o';
const TEMPLATE_RESET     = 'template_5q339b9';

export class EmailService {
    #ready = false;

    #ensureReady() {
        if (this.#ready) return;
        if (!window.emailjs) {
            throw new Error('EmailJS SDK не загружен — проверьте порядок <script> в index.html');
        }
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        this.#ready = true;
    }

    #now() {
        return new Date().toLocaleString('ru-RU', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    async sendVerification({ email, name, link }) {
        this.#ensureReady();
        return emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_VERIFY, {
            to_email: email,
            name: name || email,
            time: this.#now(),
            verification_link: link,
        });
    }

    async sendPasswordReset({ email, name, link }) {
        this.#ensureReady();
        return emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_RESET, {
            to_email: email,
            name: name || email,
            time: this.#now(),
            reset_link: link,
        });
    }
}