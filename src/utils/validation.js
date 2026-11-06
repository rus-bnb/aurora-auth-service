export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateField(field, value, allValues) {
    const rules = field.rules || {};

    if (field.type === 'checkbox') {
        return rules.required && !value ? rules.required : '';
    }

    const v = String(value ?? '').trim();

    if (!v) return rules.required || '';
    if (rules.min && v.length < rules.min) return rules.minMsg || `Минимум ${rules.min} символов`;
    if (rules.email && !EMAIL_RE.test(v)) return 'Некорректный email';

    if (rules.match) {
        const other = String(allValues[rules.match.field] ?? '');
        if (v !== other) return rules.match.msg || 'Значения не совпадают';
    }

    return '';
}