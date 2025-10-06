import jwt from 'jsonwebtoken';
const SECRET = process.env.SESSION_JWT_SECRET!;
export function signSession(payload: object, expiresIn: string | number = '10m') {
  return jwt.sign(payload, SECRET, { expiresIn });
}
export function verifySession<T = any>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}