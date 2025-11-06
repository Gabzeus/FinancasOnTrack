
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { z } from 'zod';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    const existingUser = await db
      .selectFrom('users')
      .where('email', '=', email)
      .select('id')
      .executeTakeFirst();

    if (existingUser) {
      res.status(409).json({ message: 'Utilizador já registado com este email' });
      return;
    }

    // Check if this is the first user. If so, make them an admin.
    const userCount = await db.selectFrom('users').select(db.fn.count('id').as('count')).executeTakeFirst();
    const role = userCount && Number(userCount.count) === 0 ? 'admin' : 'user';
    const licenseStatus = role === 'admin' ? 'active' : 'inactive';

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await db
      .insertInto('users')
      .values({ 
        email, 
        password_hash,
        role,
        license_status: licenseStatus,
      })
      .returning(['id', 'email', 'role'])
      .executeTakeFirstOrThrow();

    // Create default settings for the new user
    await db.insertInto('settings').values([
        { user_id: newUser.id, key: 'email_notifications_enabled', value: 'true' },
        { user_id: newUser.id, key: 'credit_card_limit_alerts_enabled', value: 'true' },
    ]).execute();

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
      return;
    }
    console.error('Falha ao registar utilizador:', error);
    res.status(500).json({ message: 'Falha ao registar utilizador' });
  }
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().nonempty('A senha é obrigatória'),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
      return;
    }
    console.error('Falha ao fazer login:', error);
    res.status(500).json({ message: 'Falha ao fazer login' });
  }
});

export default router;
