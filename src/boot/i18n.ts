import { boot } from 'quasar/wrappers';
import i18n, { initLocale } from 'src/i18n';

export default boot(({ app }) => {
    initLocale();
    app.use(i18n);
});
