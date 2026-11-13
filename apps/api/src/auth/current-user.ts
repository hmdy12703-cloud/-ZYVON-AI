export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
}
