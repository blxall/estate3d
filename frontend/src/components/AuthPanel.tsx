import { useState } from 'react';

import type { AuthPayload, AuthResponse, UserAccount } from '../types';

type Props = {
  currentUser: UserAccount | null;
  onRegister: (payload: AuthPayload) => Promise<AuthResponse>;
  onLogin: (payload: AuthPayload) => Promise<AuthResponse>;
};

export function AuthPanel({ currentUser, onRegister, onLogin }: Props) {
  const [user, setUser] = useState<UserAccount | null>(currentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submitRegister() {
    const response = await onRegister({ email, password });
    setUser(response.user);
  }

  async function submitLogin() {
    const response = await onLogin({ email, password });
    setUser(response.user);
  }

  return (
    <section className="card auth-panel">
      <h2>Аккаунт</h2>
      {user ? (
        <p>{user.email}</p>
      ) : (
        <>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <div className="actions">
            <button type="button" onClick={submitRegister}>Зарегистрироваться</button>
            <button type="button" onClick={submitLogin}>Войти</button>
          </div>
        </>
      )}
    </section>
  );
}
