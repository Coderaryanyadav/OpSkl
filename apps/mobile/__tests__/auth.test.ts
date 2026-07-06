import { useAuthStore } from '../src/core/store/useAuthStore';

describe('Zustand Auth Store', () => {
  it('should initialize with default states', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.userRole).toBe('client');
  });

  it('should allow switching user roles', () => {
    useAuthStore.getState().setRole('worker');
    expect(useAuthStore.getState().userRole).toBe('worker');

    useAuthStore.getState().setRole('client');
    expect(useAuthStore.getState().userRole).toBe('client');
  });
});
