import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth';

export default boot(({ router }) => {
  const auth = useAuthStore();
  void auth.initFromStorage();

  router.beforeEach((to) => {
    const requires = (to.meta as { requiresAuth?: boolean }).requiresAuth;
    if (requires && !auth.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
    return true;
  });
});
