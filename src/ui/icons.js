const icon = (paths) =>
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICONS = {
    mail: icon(`<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>
              <path d="M3 7l9 6 9-6"/>`),
    lock: icon(`<rect x="3.5" y="10.5" width="17" height="10.5" rx="2.5"/>
              <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"/>`),
    user: icon(`<path d="M20 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H8.2A4.2 4.2 0 0 0 4 19.2V21"/>
              <circle cx="12" cy="7.6" r="3.9"/>`),
    eye: icon(`<path d="M1.8 12S5.6 5 12 5s10.2 7 10.2 7-3.8 7-10.2 7S1.8 12 1.8 12z"/>
             <circle cx="12" cy="12" r="3.1"/>`),
    eyeOff: icon(`<path d="M17.9 17.9A10.4 10.4 0 0 1 12 19.8C5.6 19.8 1.8 12 1.8 12
                          a19 19 0 0 1 5.2-6.1M9.9 4.3A10 10 0 0 1 12 4.2c6.4 0 10.2 7.8 10.2 7.8
                          a19.2 19.2 0 0 1-2.2 3.3M14.1 14.1a3.1 3.1 0 1 1-4.2-4.2"/>
             <path d="M2 2l20 20"/>`),
    check: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0a0e1a"
               stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/></svg>`,
};