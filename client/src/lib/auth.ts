// The admin's JWT, kept in localStorage so a page refresh doesn't log out.
const KEY = "mesalista_token";

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
