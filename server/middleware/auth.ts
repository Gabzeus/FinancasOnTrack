
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: 'admin' | 'user';
        license_status: 'active' | 'inactive' | 'expired';
        whatsapp_number?: string | null;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Não autorizado, token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: 'admin' | 'user', license_status: 'active' | 'inactive' | 'expired' };
    
    // Fetch full user details to attach to request
    const user = await db.selectFrom('users')
      .where('id', '=', decoded.id)
      .select(['id', 'email', 'role', 'license_status', 'whatsapp_number'])
      .executeTakeFirst();

    if (!user) {
      res.status(401).json({ message: 'Não autorizado, usuário não encontrado' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Não autorizado, token inválido' });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Acesso negado. Rota apenas para administradores.' });
        return;
    }
    next();
};
