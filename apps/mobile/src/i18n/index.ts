import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';


const i18n = new I18n({
    en: {
        welcome: 'Welcome',
        login: 'Log In',
        signup: 'Sign Up',
        home: 'Home',
        profile: 'Profile',
        messages: 'Messages',
        settings: 'Settings',
    },
    es: {
        welcome: 'Bienvenido',
        login: 'Iniciar Sesión',
        signup: 'Registrarse',
        home: 'Inicio',
        profile: 'Perfil',
        messages: 'Mensajes',
        settings: 'Ajustes',
    }
});

i18n.locale = getLocales()[0].languageCode ?? 'en';
i18n.enableFallback = true;

export default i18n;

export const translate = (key: string, options?: any) => i18n.t(key, options);
