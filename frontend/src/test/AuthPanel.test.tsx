import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthPanel } from '../components/AuthPanel';

describe('AuthPanel', () => {
  it('registers a user and displays current account email', async () => {
    const onRegister = vi.fn().mockResolvedValue({ access_token: 'token', token_type: 'bearer', user: { id: 'user_1', email: 'agent@example.com' } });
    const onLogin = vi.fn();

    render(<AuthPanel currentUser={null} onRegister={onRegister} onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'strong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByText('agent@example.com')).toBeInTheDocument();
    expect(onRegister).toHaveBeenCalledWith({ email: 'agent@example.com', password: 'strong-password' });
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('logs in an existing user', async () => {
    const onRegister = vi.fn();
    const onLogin = vi.fn().mockResolvedValue({ access_token: 'token', token_type: 'bearer', user: { id: 'user_1', email: 'agent@example.com' } });

    render(<AuthPanel currentUser={null} onRegister={onRegister} onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'strong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('agent@example.com')).toBeInTheDocument();
    expect(onLogin).toHaveBeenCalledWith({ email: 'agent@example.com', password: 'strong-password' });
  });
});
