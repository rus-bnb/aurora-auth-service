(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const h=a=>new Promise((e,t)=>{a.onsuccess=()=>e(a.result),a.onerror=()=>t(a.error)});class V{#e;#t;#r;#i=null;#n=null;constructor({name:e,schema:t}){if(!e)throw new Error("Database name is required");if(!t?.stores)throw new Error("Schema with stores is required");this.#e=e,this.#r=t,this.#t=t.version??1}get isOpen(){return this.#i!==null}async open(){return this.#i?this.#i:this.#n?this.#n:(this.#n=new Promise((e,t)=>{const s=indexedDB.open(this.#e,this.#t);s.onupgradeneeded=i=>{this.#a(s.result,s.transaction,i.oldVersion)},s.onsuccess=()=>{this.#i=s.result,this.#i.onversionchange=()=>{this.#i?.close(),this.#i=null},e(this.#i)},s.onerror=()=>t(s.error),s.onblocked=()=>t(new Error("Database upgrade blocked by another connection"))}).finally(()=>{this.#n=null}),this.#n)}close(){this.#i?.close(),this.#i=null}async transaction(e,t,s){const i=await this.open(),r=Array.isArray(e)?e:[e];return new Promise((n,o)=>{const c=i.transaction(r,t);let p,f;c.oncomplete=()=>f?o(f):n(p),c.onerror=()=>o(c.error),c.onabort=()=>o(f??c.error??new Error("Transaction aborted"));try{p=s(c),p&&typeof p.then=="function"&&p.catch(x=>{f=x;try{c.abort()}catch{}})}catch(x){f=x;try{c.abort()}catch{}}})}#s(e,t,s){return this.transaction(e,t,i=>s(i.objectStore(e)))}get(e,t){return this.#s(e,"readonly",s=>h(s.get(t)))}getAll(e,t,s){return this.#s(e,"readonly",i=>h(i.getAll(t,s)))}getByIndex(e,t,s){return this.#s(e,"readonly",i=>h(i.index(t).get(s)))}getAllByIndex(e,t,s){return this.#s(e,"readonly",i=>h(i.index(t).getAll(s)))}add(e,t){return this.#s(e,"readwrite",s=>h(s.add(t)))}put(e,t){return this.#s(e,"readwrite",s=>h(s.put(t)))}delete(e,t){return this.#s(e,"readwrite",s=>h(s.delete(t)))}count(e,t){return this.#s(e,"readonly",s=>h(s.count(t)))}clear(e){return this.#s(e,"readwrite",t=>h(t.clear()))}#a(e,t,s){for(const[i,r]of Object.entries(this.#r.stores)){let n;e.objectStoreNames.contains(i)?n=t.objectStore(i):n=e.createObjectStore(i,{keyPath:r.keyPath,autoIncrement:r.autoIncrement??!1});for(const[o,c]of Object.entries(r.indexes??{}))n.indexNames.contains(o)||n.createIndex(o,c.keyPath,{unique:c.unique??!1,multiEntry:c.multiEntry??!1})}}}const U={version:2,stores:{users:{keyPath:"id",autoIncrement:!1,indexes:{byEmail:{keyPath:"email",unique:!0}}},sessions:{keyPath:"userId",autoIncrement:!1,indexes:{byCreatedAt:{keyPath:"createdAt"}}},verifications:{keyPath:"token",autoIncrement:!1,indexes:{byUserId:{keyPath:"userId"},byExpiresAt:{keyPath:"expiresAt"}}},passwordResets:{keyPath:"token",autoIncrement:!1,indexes:{byUserId:{keyPath:"userId"},byExpiresAt:{keyPath:"expiresAt"}}}}};class v{#e;#t;constructor(e,t){this.#e=e,this.#t=t}findById(e){return this.#e.get(this.#t,e)}findAll(){return this.#e.getAll(this.#t)}findOneByIndex(e,t){return this.#e.getByIndex(this.#t,e,t)}findAllByIndex(e,t){return this.#e.getAllByIndex(this.#t,e,t)}add(e){return this.#e.add(this.#t,e)}save(e){return this.#e.put(this.#t,e)}remove(e){return this.#e.delete(this.#t,e)}count(e){return this.#e.count(this.#t,e)}clear(){return this.#e.clear(this.#t)}}class O extends v{constructor(e){super(e,"users")}findByEmail(e){return this.findOneByIndex("byEmail",e.toLowerCase())}}class _ extends v{constructor(e){super(e,"sessions")}}class N extends v{constructor(e){super(e,"verifications")}findByUser(e){return this.findOneByIndex("byUserId",e)}async deleteExpired(e=Date.now()){const s=(await this.findAll()).filter(i=>i.expiresAt<e);await Promise.all(s.map(i=>this.remove(i.token)))}}class j extends v{constructor(e){super(e,"passwordResets")}findByUser(e){return this.findOneByIndex("byUserId",e)}}const F=new TextEncoder,$=a=>[...new Uint8Array(a)].map(e=>e.toString(16).padStart(2,"0")).join(""),K=a=>new Uint8Array(a.match(/.{2}/g).map(e=>parseInt(e,16))),H=async(a,e)=>{const t=await crypto.subtle.importKey("raw",F.encode(a),"PBKDF2",!1,["deriveBits"]);return crypto.subtle.deriveBits({name:"PBKDF2",salt:e,iterations:1e5,hash:"SHA-256"},t,256)};async function q(a){const e=crypto.getRandomValues(new Uint8Array(16)),t=await H(a,e);return`${$(e)}:${$(t)}`}async function Y(a,e){const[t,s]=e.split(":"),i=await H(a,K(t)),r=$(i);if(r.length!==s.length)return!1;let n=0;for(let o=0;o<r.length;o++)n|=r.charCodeAt(o)^s.charCodeAt(o);return n===0}function S(){if(typeof crypto<"u"&&crypto.randomUUID)return crypto.randomUUID();const a=crypto.getRandomValues(new Uint8Array(16));a[6]=a[6]&15|64,a[8]=a[8]&63|128;const e=[...a].map(t=>t.toString(16).padStart(2,"0")).join("");return`${e.slice(0,8)}-${e.slice(8,12)}-${e.slice(12,16)}-${e.slice(16,20)}-${e.slice(20)}`}class l extends Error{constructor(e){super(e),this.name="AuthError"}}const I=30*24*60*60*1e3,C=24*60*60*1e3;class z{#e;#t;#r;#i;#n;#s=null;constructor({userRepo:e,sessionRepo:t,verificationRepo:s,passwordResetRepo:i,emailService:r}){this.#e=e,this.#t=t,this.#r=s,this.#i=i,this.#n=r}get currentUser(){return this.#s}async register({name:e,email:t,password:s}){if(!t||!s)throw new l("Заполните все поля");if(await this.#e.findByEmail(t))throw new l("Аккаунт с таким email уже существует");const r={id:S(),name:e?.trim()||t,email:t.toLowerCase(),passwordHash:await q(s),emailVerified:!1,createdAt:Date.now()};return await this.#e.add(r),await this.#a(r),await this.#t.save({userId:r.id,createdAt:Date.now(),expiresAt:Date.now()+I}),this.#s=this.#o(r),this.#s}async login({email:e,password:t,remember:s=!1}){const i=await this.#e.findByEmail(e);if(!i)throw new l("Неверный email или пароль");if(!await Y(t,i.passwordHash))throw new l("Неверный email или пароль");return s&&await this.#t.save({userId:i.id,createdAt:Date.now(),expiresAt:Date.now()+I}),this.#s=this.#o(i),this.#s}async logout(){if(this.#s)try{await this.#t.remove(this.#s.id)}catch{}this.#s=null}async restoreSession(){const e=await this.#t.findAll(),t=Date.now();let s=null;for(const r of e){if(r.expiresAt&&r.expiresAt<t){await this.#t.remove(r.userId);continue}(!s||r.createdAt>=s.createdAt)&&(s=r)}if(!s)return null;const i=await this.#e.findById(s.userId);return i?(this.#s=this.#o(i),this.#s):(await this.#t.remove(s.userId),null)}async#a(e){const t=await this.#r.findByUser(e.id);t&&await this.#r.remove(t.token);const s=S();await this.#r.add({token:s,userId:e.id,expiresAt:Date.now()+C});const i=`${location.origin}${location.pathname}#/verify?token=${s}`;await this.#n.sendVerification({email:e.email,name:e.name,link:i})}async verifyEmail(e){const t=await this.#r.findById(e);if(!t)throw new l("Ссылка недействительна или истекла");if(t.expiresAt<Date.now())throw await this.#r.remove(e),new l("Срок действия ссылки истёк");const s=await this.#e.findById(t.userId);if(!s)throw new l("Пользователь не найден");return s.emailVerified=!0,await this.#e.save(s),await this.#r.remove(e),this.#s?.id===s.id&&(this.#s=this.#o(s)),this.#s}async resendVerification(){if(!this.#s)throw new l("Требуется вход");const e=await this.#e.findById(this.#s.id);if(!e)throw new l("Пользователь не найден");if(e.emailVerified)throw new l("Email уже подтверждён");await this.#a(e)}async requestPasswordReset(e){const t=await this.#e.findByEmail(e);if(!t)return;if(!t.emailVerified)throw new l("Сначала подтвердите email — восстановление пароля недоступно");const s=await this.#i.findByUser(t.id);s&&await this.#i.remove(s.token);const i=S();await this.#i.add({token:i,userId:t.id,expiresAt:Date.now()+C});const r=`${location.origin}${location.pathname}#/reset-password?token=${i}`;await this.#n.sendPasswordReset({email:t.email,name:t.name,link:r})}async resetPassword(e,t){if(!t||t.length<8)throw new l("Пароль должен быть не короче 8 символов");const s=await this.#i.findById(e);if(!s)throw new l("Ссылка недействительна или истекла");if(s.expiresAt<Date.now())throw await this.#i.remove(e),new l("Срок действия ссылки истёк");const i=await this.#e.findById(s.userId);if(!i)throw new l("Пользователь не найден");i.passwordHash=await q(t),await this.#e.save(i),await this.#i.remove(e),await this.#t.remove(i.id)}async updateProfile(e,{name:t,email:s}){const i=await this.#e.findById(e);if(!i)throw new l("Пользователь не найден");const r=s?s.toLowerCase():i.email,n=r!==i.email;if(n){if(await this.#e.findByEmail(r))throw new l("Этот email уже занят");i.email=r,i.emailVerified=!1}return t!=null&&(i.name=t.trim()||i.name),await this.#e.save(i),n&&await this.#a(i),this.#s?.id===i.id&&(this.#s=this.#o(i)),this.#s}#o({passwordHash:e,...t}){return t}}const P="service_c23yjit",G="zY2oY6SyX-r5AgMmL",J="template_u6hpt3o",W="template_5q339b9";class Z{#e=!1;#t(){if(!this.#e){if(!window.emailjs)throw new Error("EmailJS SDK не загружен — проверьте порядок <script> в index.html");emailjs.init({publicKey:G}),this.#e=!0}}#r(){return new Date().toLocaleString("ru-RU",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}async sendVerification({email:e,name:t,link:s}){return this.#t(),emailjs.send(P,J,{to_email:e,name:t||e,time:this.#r(),verification_link:s})}async sendPasswordReset({email:e,name:t,link:s}){return this.#t(),emailjs.send(P,W,{to_email:e,name:t||e,time:this.#r(),reset_link:s})}}function X(a){return{login:{eyebrow:"Вход в аккаунт",title:"С возвращением",subtitle:"Войдите, чтобы продолжить работу с Aurora.",submit:"Войти",successText:"Вход выполнен!",fields:[{name:"email",type:"email",label:"Email",placeholder:"you@example.com",autocomplete:"email",icon:"mail",inputmode:"email",rules:{required:"Введите email",email:!0}},{name:"password",type:"password",label:"Пароль",placeholder:"Введите пароль",autocomplete:"current-password",icon:"lock",rules:{required:"Введите пароль"},action:{label:"Забыли пароль?",action:"forgot"}},{name:"remember",type:"checkbox",label:"Запомнить меня на 30 дней"}],footer:{text:"Нет аккаунта?",linkText:"Создать аккаунт",to:"register"},onSubmit:e=>a.login({email:e.email,password:e.password,remember:e.remember})},register:{eyebrow:"Новый аккаунт",title:"Создать аккаунт",subtitle:"Займёт меньше минуты. Никаких карт и подтверждений.",submit:"Создать аккаунт",successText:"Аккаунт создан!",fields:[{name:"name",type:"text",label:"Имя",placeholder:"Как к вам обращаться?",autocomplete:"name",icon:"user",rules:{required:"Введите имя",min:2,minMsg:"Слишком короткое имя"}},{name:"email",type:"email",label:"Email",placeholder:"you@example.com",autocomplete:"email",icon:"mail",inputmode:"email",rules:{required:"Введите email",email:!0}},{name:"password",type:"password",label:"Пароль",placeholder:"Минимум 8 символов",autocomplete:"new-password",icon:"lock",strength:!0,rules:{required:"Придумайте пароль",min:8,minMsg:"Минимум 8 символов"}},{name:"passwordConfirm",type:"password",label:"Повторите пароль",placeholder:"Ещё раз",autocomplete:"new-password",icon:"lock",rules:{required:"Повторите пароль",match:{field:"password",msg:"Пароли не совпадают"}}},{name:"agree",type:"checkbox",label:"Я принимаю условия использования и политику конфиденциальности",rules:{required:"Необходимо принять условия"}}],footer:{text:"Уже есть аккаунт?",linkText:"Войти",to:"login"},onSubmit:e=>a.register({name:e.name,email:e.email,password:e.password})}}}const w=a=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${a}</svg>`,d={mail:w(`<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>
              <path d="M3 7l9 6 9-6"/>`),lock:w(`<rect x="3.5" y="10.5" width="17" height="10.5" rx="2.5"/>
              <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"/>`),user:w(`<path d="M20 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H8.2A4.2 4.2 0 0 0 4 19.2V21"/>
              <circle cx="12" cy="7.6" r="3.9"/>`),eye:w(`<path d="M1.8 12S5.6 5 12 5s10.2 7 10.2 7-3.8 7-10.2 7S1.8 12 1.8 12z"/>
             <circle cx="12" cy="12" r="3.1"/>`),eyeOff:w(`<path d="M17.9 17.9A10.4 10.4 0 0 1 12 19.8C5.6 19.8 1.8 12 1.8 12
                          a19 19 0 0 1 5.2-6.1M9.9 4.3A10 10 0 0 1 12 4.2c6.4 0 10.2 7.8 10.2 7.8
                          a19.2 19.2 0 0 1-2.2 3.3M14.1 14.1a3.1 3.1 0 1 1-4.2-4.2"/>
             <path d="M2 2l20 20"/>`),check:`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0a0e1a"
               stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/></svg>`},Q=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;function y(a,e,t){const s=a.rules||{};if(a.type==="checkbox")return s.required&&!e?s.required:"";const i=String(e??"").trim();if(!i)return s.required||"";if(s.min&&i.length<s.min)return s.minMsg||`Минимум ${s.min} символов`;if(s.email&&!Q.test(i))return"Некорректный email";if(s.match){const r=String(t[s.match.field]??"");if(i!==r)return s.match.msg||"Значения не совпадают"}return""}const ee=["","Слабый","Средний","Хороший","Надёжный"];class te extends HTMLElement{#e=null;#t=!1;#r=!1;set schema(e){this.#e=e,this.#i()}get schema(){return this.#e}connectedCallback(){this.#e&&!this.#t&&this.#i()}#i(){if(!this.#e)return;const e=this.#e;this.#t=!0,this.innerHTML=`
      <header class="head">
        ${e.eyebrow?`<span class="eyebrow">${e.eyebrow}</span>`:""}
        <h1>${e.title}</h1>
        <p>${e.subtitle}</p>
      </header>

      <form class="form" novalidate autocomplete="on">
        ${e.fields.map(t=>this.#n(t)).join("")}
        <p class="form-error" data-form-error role="alert"></p>
        <button class="submit" type="submit">
          <span class="spinner" aria-hidden="true"></span>
          <span class="submit-label">${e.submit}</span>
        </button>
        <p class="note" data-note role="status"></p>
        ${e.footer?`<p class="foot">${e.footer.text}
               <a href="#/${e.footer.to}" data-nav="${e.footer.to}">${e.footer.linkText}</a>
             </p>`:""}
      </form>
    `,this.#s()}#n(e){const t=`f-${e.name}`,s=`e-${e.name}`;if(e.type==="checkbox")return`
        <div class="field field--check" data-field="${e.name}">
          <label class="checkbox" for="${t}">
            <input type="checkbox" id="${t}" name="${e.name}" aria-describedby="${s}" />
            <span class="box" aria-hidden="true">${d.check}</span>
            <span>${e.label}</span>
          </label>
          <p class="error" id="${s}" data-error></p>
        </div>`;const i=e.type==="password";return`
      <div class="field" data-field="${e.name}">
        <div class="field-head">
          <label for="${t}">${e.label}</label>
          ${e.action?`<button type="button" class="mini-link" data-action="${e.action.action}">
                 ${e.action.label}
               </button>`:""}
        </div>
        <div class="control${e.icon?" has-icon":""}">
          ${e.icon?`<span class="icon">${d[e.icon]}</span>`:""}
          <input
            id="${t}" name="${e.name}" type="${e.type}"
            placeholder="${e.placeholder||""}"
            autocomplete="${e.autocomplete||"off"}"
            ${e.inputmode?`inputmode="${e.inputmode}"`:""}
            aria-describedby="${s}"
          />
          ${i?`<button type="button" class="toggle" data-toggle
                       aria-label="Показать пароль" aria-pressed="false">
                 ${d.eye}
               </button>`:""}
        </div>
        ${e.strength?`<div class="strength" data-strength data-level="0" aria-hidden="true">
               <i></i><i></i><i></i><i></i>
             </div>
             <p class="strength-label" data-strength-label aria-live="polite"></p>`:""}
        <p class="error" id="${s}" data-error></p>
      </div>`}#s(){const e=this.querySelector("form");e.addEventListener("submit",t=>this.#b(t)),e.addEventListener("input",t=>this.#p(t)),e.addEventListener("focusout",t=>this.#f(t)),this.querySelectorAll("[data-toggle]").forEach(t=>t.addEventListener("click",()=>this.#m(t))),this.querySelectorAll("[data-nav]").forEach(t=>t.addEventListener("click",s=>{s.preventDefault(),this.dispatchEvent(new CustomEvent("navigate",{detail:{to:t.dataset.nav},bubbles:!0,composed:!0}))})),this.querySelectorAll("[data-action]").forEach(t=>t.addEventListener("click",()=>this.#y(t.dataset.action)))}#a(){const e={};return this.querySelectorAll("input[name]").forEach(t=>{e[t.name]=t.type==="checkbox"?t.checked:t.value}),e}#o(e){return e.closest(".field")}#c(e){return this.#e.fields.find(t=>t.name===e)}#l(e,t){if(!e)return;const s=e.querySelector("[data-error]"),i=e.querySelector("input");t?(e.classList.add("is-invalid"),s&&(s.textContent=t),i&&i.setAttribute("aria-invalid","true")):(e.classList.remove("is-invalid"),s&&(s.textContent=""),i&&i.removeAttribute("aria-invalid"))}#d(e=""){const t=this.querySelector("[data-form-error]");t&&(t.textContent=e,t.classList.toggle("show",!!e))}#u(e=""){const t=this.querySelector("[data-note]");t&&(t.textContent=e,t.classList.toggle("show",!!e))}#h(e){this.#r=e;const t=this.querySelector(".submit");t&&(t.disabled=e,t.classList.toggle("is-loading",e))}#m(e){const t=e.parentElement.querySelector("input"),s=t.type==="password";t.type=s?"text":"password",e.innerHTML=s?d.eyeOff:d.eye,e.setAttribute("aria-pressed",String(s)),e.setAttribute("aria-label",s?"Скрыть пароль":"Показать пароль"),t.focus({preventScroll:!0})}#p(e){const t=e.target;if(!(t instanceof HTMLInputElement))return;const s=this.#o(t),i=this.#c(t.name);if(!(!s||!i)){if(s.classList.contains("is-invalid")){const r=t.type==="checkbox"?t.checked:t.value;this.#l(s,y(i,r,this.#a()))}if(i.strength&&this.#w(s,t.value),t.name==="password"){const r=this.querySelector('[data-field="passwordConfirm"]'),n=this.#c("passwordConfirm");if(r?.classList.contains("is-invalid")&&n){const o=this.#a();this.#l(r,y(n,o.passwordConfirm,o))}}this.#d("")}}#f(e){const t=e.target;if(!(t instanceof HTMLInputElement))return;const s=this.#o(t),i=this.#c(t.name);if(!s||!i)return;const r=t.type==="checkbox"?t.checked:t.value;!String(r).trim()&&!s.classList.contains("is-invalid")||this.#l(s,y(i,r,this.#a()))}#w(e,t){const s=e.querySelector("[data-strength]"),i=e.querySelector("[data-strength-label]");if(!s)return;let r=0;t.length>=8&&r++,t.length>=12&&r++,/[A-ZА-ЯЁ]/.test(t)&&/[a-zа-яё]/.test(t)&&r++,/\d/.test(t)&&r++,/[^\p{L}\p{N}\s]/u.test(t)&&r++,r=Math.min(r,4),t||(r=0),s.dataset.level=String(r),i&&(i.textContent=t?ee[r]:"")}#y(e){if(e==="forgot"){const t=this.querySelector('input[name="email"]')?.value.trim()||"";this.dispatchEvent(new CustomEvent("navigate",{detail:{to:"forgot",prefill:{email:t}},bubbles:!0,composed:!0}))}}async#b(e){if(e.preventDefault(),this.#r)return;this.#d(""),this.#u("");const t=this.#a();let s=null;for(const i of this.#e.fields){const r=this.querySelector(`[data-field="${i.name}"]`);if(!r)continue;const n=y(i,t[i.name],t);this.#l(r,n),n&&!s&&(s=r.querySelector("input"))}if(s){s.focus(),this.#d("Проверьте выделенные поля");return}this.#h(!0);try{const i=await this.#e.onSubmit(t);this.#u(this.#e.successText||"Готово!"),this.dispatchEvent(new CustomEvent("auth:success",{detail:{user:i},bubbles:!0,composed:!0}))}catch(i){this.#d(i?.message||"Не удалось выполнить запрос")}finally{this.#h(!1)}}}customElements.define("auth-form",te);const L=a=>String(a).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);class se extends HTMLElement{#e=null;set user(e){this.#e=e,this.#t()}get user(){return this.#e}#t(){if(!this.#e)return;const e=this.#e.name||this.#e.email,t=this.#e.email,s=String(e).trim()[0]?.toUpperCase()||"?";this.innerHTML=`
      <div class="welcome">
        <div class="welcome-avatar" aria-hidden="true">${L(s)}</div>
        <h1>С возвращением, ${L(e)}</h1>
        <p>Вы вошли как ${L(t)}</p>
        <button class="submit" type="button" data-logout>
          <span class="submit-label">Выйти</span>
        </button>
      </div>
    `,this.querySelector("[data-logout]").addEventListener("click",()=>{this.dispatchEvent(new CustomEvent("auth:logout",{bubbles:!0,composed:!0}))})}}customElements.define("welcome-view",se);const T=a=>String(a).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);class ie extends HTMLElement{#e=null;#t=null;set data({user:e,auth:t}){this.#e=e,this.#t=t,this.#r()}#r(){const e=this.#e,t=T(e.name||e.email),s=T(e.email);String(e.name||e.email).trim()[0]?.toUpperCase(),this.innerHTML=`
          <header class="head">
            <span class="eyebrow">Личный кабинет</span>
            <h1>Профиль</h1>
            <p>${e.emailVerified?"Email подтверждён":'<span class="status-warn">Email не подтверждён — восстановление пароля недоступно</span>'}</p>
          </header>

          <form class="form" id="profile-form">
            <div class="field">
              <label>Имя</label>
              <div class="control"><input name="name" value="${t}" /></div>
            </div>
            <div class="field">
              <label>Email</label>
              <div class="control"><input name="email" type="email" value="${s}" /></div>
            </div>

            <p class="form-error" data-error></p>

            <button class="submit" type="submit">
              <span class="submit-label">Сохранить</span>
            </button>

            ${e.emailVerified?"":'<button type="button" class="mini-link" data-resend>Отправить письмо повторно</button>'}

            <p class="foot">
              <a href="#/forgot" data-nav>Сменить пароль</a>
              &nbsp;·&nbsp;
              <a href="#" data-logout>Выйти</a>
            </p>
          </form>
        `,this.querySelector("#profile-form").addEventListener("submit",async i=>{i.preventDefault();const r=new FormData(i.target),n=this.querySelector("[data-error]");n.classList.remove("show","note"),n.textContent="";try{await this.#t.updateProfile(e.id,{name:r.get("name"),email:r.get("email")}),this.dispatchEvent(new CustomEvent("profile:updated",{detail:{user:this.#t.currentUser},bubbles:!0,composed:!0}))}catch(o){n.textContent=o.message,n.classList.add("show")}}),this.querySelector("[data-resend]")?.addEventListener("click",async()=>{const i=this.querySelector("[data-error]");i.classList.remove("show");try{await this.#t.resendVerification(),i.textContent="Письмо отправлено повторно",i.classList.add("show","note")}catch(r){i.textContent=r.message,i.classList.add("show")}}),this.querySelector("[data-logout]").addEventListener("click",i=>{i.preventDefault(),this.dispatchEvent(new CustomEvent("auth:logout",{bubbles:!0,composed:!0}))})}}customElements.define("profile-view",ie);class re extends HTMLElement{#e=null;set auth(e){this.#e=e,this.#t()}set prefill(e){const t=this.querySelector('input[name="email"]');t&&e&&(t.value=e)}#t(){this.innerHTML=`
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
        `,this.querySelector("form").addEventListener("submit",async e=>{e.preventDefault();const t=this.querySelector("[data-error]"),s=new FormData(e.target).get("email");try{await this.#e.requestPasswordReset(s),this.querySelector("[data-error]").textContent="Если аккаунт существует и подтверждён, письмо отправлено.",t.classList.remove("form-error"),t.classList.add("note","show")}catch(i){t.textContent=i.message,t.classList.add("show")}})}}customElements.define("forgot-password-view",re);const ae=["","Слабый","Средний","Хороший","Надёжный"],A=8;class ne extends HTMLElement{#e=null;#t=null;#r=!1;set data({auth:e,token:t}){this.#e=e,this.#t=t,this.#i()}#i(){this.innerHTML=`
          <header class="head">
            <span class="eyebrow">Новый пароль</span>
            <h1>Сброс пароля</h1>
            <p>Придумайте новый пароль для входа в аккаунт.</p>
          </header>

          <form class="form" novalidate>
            <div class="field" data-field="password">
              <label for="rp-password">Новый пароль</label>
              <div class="control has-icon">
                <span class="icon">${d.lock}</span>
                <input id="rp-password" name="password" type="password"
                       placeholder="Минимум ${A} символов"
                       autocomplete="new-password"
                       aria-describedby="rp-password-error" />
                <button type="button" class="toggle" data-toggle
                        aria-label="Показать пароль" aria-pressed="false">${d.eye}</button>
              </div>
              <div class="strength" data-strength data-level="0" aria-hidden="true">
                <i></i><i></i><i></i><i></i>
              </div>
              <p class="strength-label" data-strength-label aria-live="polite"></p>
              <p class="error" id="rp-password-error" data-error></p>
            </div>

            <div class="field" data-field="confirm">
              <label for="rp-confirm">Повторите пароль</label>
              <div class="control has-icon">
                <span class="icon">${d.lock}</span>
                <input id="rp-confirm" name="confirm" type="password"
                       placeholder="Ещё раз" autocomplete="new-password"
                       aria-describedby="rp-confirm-error" />
                <button type="button" class="toggle" data-toggle
                        aria-label="Показать пароль" aria-pressed="false">${d.eye}</button>
              </div>
              <p class="error" id="rp-confirm-error" data-error></p>
            </div>

            <p class="form-error" data-form-error role="alert"></p>

            <button class="submit" type="submit">
              <span class="spinner" aria-hidden="true"></span>
              <span class="submit-label">Сохранить пароль</span>
            </button>

            <p class="note" data-note role="status"></p>
            <p class="foot"><a href="#/login" data-nav>Назад ко входу</a></p>
          </form>
        `,this.#n()}#n(){const e=this.querySelector("form"),t=this.querySelector('input[name="password"]'),s=this.querySelector('input[name="confirm"]');e.addEventListener("submit",i=>this.#m(i)),t.addEventListener("input",()=>{this.#h(t.value),this.#s(!1),s.value&&this.#a(!1)}),s.addEventListener("input",()=>this.#a(!1)),s.addEventListener("blur",()=>this.#a(!0)),this.querySelectorAll("[data-toggle]").forEach(i=>{i.addEventListener("click",()=>this.#u(i))}),this.querySelectorAll("[data-nav]").forEach(i=>{i.addEventListener("click",r=>{r.preventDefault(),this.dispatchEvent(new CustomEvent("navigate",{detail:{to:i.dataset.nav.replace(/^#\//,"")},bubbles:!0,composed:!0}))})})}#s(e=!0){const t=this.querySelector('input[name="password"]'),s=this.querySelector('[data-field="password"]'),i=t.value;let r="";return i?i.length<A&&(r=`Минимум ${A} символов`):e&&(r="Придумайте пароль"),this.#o(s,r),!r&&i.length>0}#a(e=!1){const t=this.querySelector('input[name="password"]').value,s=this.querySelector('input[name="confirm"]'),i=this.querySelector('[data-field="confirm"]'),r=s.value;let n="";return r?r!==t&&(n="Пароли не совпадают"):e&&(n="Повторите пароль"),this.#o(i,n),!n&&r.length>0}#o(e,t){if(!e)return;const s=e.querySelector("[data-error]"),i=e.querySelector("input");t?(e.classList.add("is-invalid"),s&&(s.textContent=t),i&&i.setAttribute("aria-invalid","true")):(e.classList.remove("is-invalid"),s&&(s.textContent=""),i&&i.removeAttribute("aria-invalid"))}#c(e=""){const t=this.querySelector("[data-form-error]");t&&(t.textContent=e,t.classList.toggle("show",!!e))}#l(e=""){const t=this.querySelector("[data-note]");t&&(t.textContent=e,t.classList.toggle("show",!!e))}#d(e){this.#r=e;const t=this.querySelector(".submit");t&&(t.disabled=e,t.classList.toggle("is-loading",e))}#u(e){const t=e.parentElement.querySelector("input"),s=t.type==="password";t.type=s?"text":"password",e.innerHTML=s?d.eyeOff:d.eye,e.setAttribute("aria-pressed",String(s)),e.setAttribute("aria-label",s?"Скрыть пароль":"Показать пароль"),t.focus({preventScroll:!0})}#h(e){const t=this.querySelector("[data-strength]"),s=this.querySelector("[data-strength-label]");let i=0;e.length>=8&&i++,e.length>=12&&i++,/[A-ZА-ЯЁ]/.test(e)&&/[a-zа-яё]/.test(e)&&i++,/\d/.test(e)&&i++,/[^\p{L}\p{N}\s]/u.test(e)&&i++,i=Math.min(i,4),e||(i=0),t.dataset.level=String(i),s.textContent=e?ae[i]:""}async#m(e){if(e.preventDefault(),this.#r)return;this.#c(""),this.#l("");const t=this.#s(!0),s=this.#a(!0);if(!t||!s){this.#c("Проверьте поля выше"),this.querySelector(".field.is-invalid input")?.focus();return}const i=this.querySelector('input[name="password"]').value;this.#d(!0);try{await this.#e.resetPassword(this.#t,i),this.querySelectorAll("input, button.submit, [data-toggle]").forEach(r=>{r.disabled=!0}),this.#l("Пароль обновлён. Сейчас перенаправим на страницу входа…"),setTimeout(()=>{location.hash="#/login"},1800)}catch(r){this.#c(r.message||"Не удалось обновить пароль"),/истек|недействительн/i.test(r.message||"")&&this.#l("Ссылка недействительна. Запросите новую через «Забыли пароль?» на странице входа.")}finally{this.#d(!1)}}}customElements.define("reset-password-view",ne);class oe extends HTMLElement{#e=null;#t=null;set data({auth:e,token:t}){this.#e=e,this.#t=t,this.#r(),this.#i()}#r(){this.innerHTML=`
          <div class="welcome">
            <h1>Подтверждение email</h1>
            <p data-status>Проверяем ссылку…</p>
            <p class="form-error" data-error></p>
          </div>
        `}async#i(){try{await this.#e.verifyEmail(this.#t),this.querySelector("[data-status]").textContent="Email успешно подтверждён!",setTimeout(()=>{location.hash="#/profile"},1200)}catch(e){this.querySelector("[data-error]").textContent=e.message}}}customElements.define("verify-email-view",oe);const b=new V({name:"aurora-auth",schema:U}),m=new z({userRepo:new O(b),sessionRepo:new _(b),verificationRepo:new N(b),passwordResetRepo:new j(b),emailService:new Z}),B=X(m),u=document.getElementById("view");function E(){u.classList.remove("anim"),u.offsetWidth,u.classList.add("anim")}function D(a){const e=B[a]??B.login;document.title=`${e.title} — Aurora`,u.innerHTML="";const t=document.createElement("auth-form");t.schema=e,u.appendChild(t),E()}function g(){const a=m.currentUser;if(!a)return D("login");document.title="Профиль — Aurora",u.innerHTML="";const e=document.createElement("profile-view");e.data={user:a,auth:m},u.appendChild(e),E()}function M(a,e,t){t&&(document.title=`${t} — Aurora`),u.innerHTML="";const s=document.createElement(a);e&&Object.assign(s,e),u.appendChild(s),E()}function le(){const a=location.hash.replace(/^#\/?/,""),[e,t=""]=a.split("?");return{path:e||"login",params:new URLSearchParams(t)}}function k(){const{path:a,params:e}=le();switch(a){case"profile":g();break;case"forgot":{const t=R?.email||"";R=null,document.title="Восстановление пароля — Aurora",u.innerHTML="";const s=document.createElement("forgot-password-view");s.auth=m,s.prefill=t,u.appendChild(s),E();break}case"reset-password":M("reset-password-view",{data:{auth:m,token:e.get("token")}},"Новый пароль");break;case"verify":M("verify-email-view",{data:{auth:m,token:e.get("token")}},"Подтверждение email");break;case"register":case"login":default:m.currentUser?g():D(a==="register"?"register":"login")}}window.addEventListener("hashchange",k);document.addEventListener("auth:success",()=>{location.hash="#/profile"});document.addEventListener("auth:logout",async()=>{await m.logout(),location.hash="#/login"});document.addEventListener("profile:updated",()=>{g()});let R=null;document.addEventListener("navigate",a=>{const e=a.detail?.to;if(!e)return;const t=`#/${e}`;location.hash===t?k():location.hash=t});(async()=>await m.restoreSession()?location.hash!=="#/profile"?location.hash="#/profile":g():k())();
