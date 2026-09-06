const STORAGE_KEY = 'medikiosk_doctor_token';

let currentToken: string | null = localStorage.getItem(STORAGE_KEY);
let currentName: string | null = localStorage.getItem(`${STORAGE_KEY}_name`);

export function getToken(): string | null {
  return currentToken;
}

export function getDoctorName(): string | null {
  return currentName;
}

export function setSession(token: string, name: string): void {
  currentToken = token;
  currentName = name;
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(`${STORAGE_KEY}_name`, name);
}

export function clearSession(): void {
  currentToken = null;
  currentName = null;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}_name`);
}
