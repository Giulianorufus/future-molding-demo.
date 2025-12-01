import { apiFetch } from './api';

export async function getPresses() {
  return apiFetch('press');
}

export async function createPress(data: any) {
  return apiFetch('press', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
