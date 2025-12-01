import { apiFetch } from './api';

export async function getUsers() {
  return apiFetch('user');
}

export async function createUser(data: any) {
  return apiFetch('user', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(username: string, password: string) {
  // Da implementare lato backend
  return apiFetch('user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
