export function buildPages(auth) {
    return {
        login: {
            eyebrow: 'Вход в аккаунт',
            title: 'С возвращением',
            subtitle: 'Войдите, чтобы продолжить работу с Aurora.',
            submit: 'Войти',
            successText: 'Вход выполнен!',
            fields: [
                {
                    name: 'email', type: 'email', label: 'Email',
                    placeholder: 'you@example.com', autocomplete: 'email',
                    icon: 'mail', inputmode: 'email',
                    rules: { required: 'Введите email', email: true },
                },
                {
                    name: 'password', type: 'password', label: 'Пароль',
                    placeholder: 'Введите пароль', autocomplete: 'current-password',
                    icon: 'lock',
                    rules: { required: 'Введите пароль' },
                    action: { label: 'Забыли пароль?', action: 'forgot' },
                },
                {
                    name: 'remember', type: 'checkbox', label: 'Запомнить меня на 30 дней',
                },
            ],
            footer: { text: 'Нет аккаунта?', linkText: 'Создать аккаунт', to: 'register' },
            onSubmit: (values) => auth.login({
                email: values.email,
                password: values.password,
                remember: values.remember,
            }),
        },

        register: {
            eyebrow: 'Новый аккаунт',
            title: 'Создать аккаунт',
            subtitle: 'Займёт меньше минуты. Никаких карт и подтверждений.',
            submit: 'Создать аккаунт',
            successText: 'Аккаунт создан!',
            fields: [
                {
                    name: 'name', type: 'text', label: 'Имя',
                    placeholder: 'Как к вам обращаться?', autocomplete: 'name',
                    icon: 'user',
                    rules: { required: 'Введите имя', min: 2, minMsg: 'Слишком короткое имя' },
                },
                {
                    name: 'email', type: 'email', label: 'Email',
                    placeholder: 'you@example.com', autocomplete: 'email',
                    icon: 'mail', inputmode: 'email',
                    rules: { required: 'Введите email', email: true },
                },
                {
                    name: 'password', type: 'password', label: 'Пароль',
                    placeholder: 'Минимум 8 символов', autocomplete: 'new-password',
                    icon: 'lock', strength: true,
                    rules: { required: 'Придумайте пароль', min: 8, minMsg: 'Минимум 8 символов' },
                },
                {
                    name: 'passwordConfirm', type: 'password', label: 'Повторите пароль',
                    placeholder: 'Ещё раз', autocomplete: 'new-password',
                    icon: 'lock',
                    rules: {
                        required: 'Повторите пароль',
                        match: { field: 'password', msg: 'Пароли не совпадают' },
                    },
                },
                {
                    name: 'agree', type: 'checkbox',
                    label: 'Я принимаю условия использования и политику конфиденциальности',
                    rules: { required: 'Необходимо принять условия' },
                },
            ],
            footer: { text: 'Уже есть аккаунт?', linkText: 'Войти', to: 'login' },
            onSubmit: (values) => auth.register({
                name: values.name,
                email: values.email,
                password: values.password,
            }),
        },
    };
}