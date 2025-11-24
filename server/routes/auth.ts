
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/database';
import { z } from 'zod';
import { sendPasswordResetEmail } from '../services/emailService';
import { sql } from 'kysely';

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
      .returning(['id', 'email', 'role', 'license_status', 'whatsapp_number'])
      .executeTakeFirstOrThrow();

    // Create default settings for the new user
    await db.insertInto('settings').values([
        { user_id: newUser.id, key: 'email_notifications_enabled', value: 'true' },
        { user_id: newUser.id, key: 'credit_card_limit_alerts_enabled', value: 'true' },
        { user_id: newUser.id, key: 'whatsapp_notifications_enabled', value: 'true' },
    ]).execute();

    const token = jwt.sign({ id: newUser.id, role: newUser.role, license_status: newUser.license_status }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role, license_status: newUser.license_status, whatsapp_number: newUser.whatsapp_number } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues.map(e => e.message).join(', ') });
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

    const token = jwt.sign({ id: user.id, role: user.role, license_status: user.license_status }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role, license_status: user.license_status, whatsapp_number: user.whatsapp_number } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues.map(e => e.message).join(', ') });
      return;
    }
    console.error('Falha ao fazer login:', error);
    res.status(500).json({ message: 'Falha ao fazer login' });
  }
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await db.selectFrom('users').where('email', '=', email).select('id').executeTakeFirst();

    if (!user) {
      // Respond successfully even if user doesn't exist to prevent email enumeration
      res.status(200).json({ message: 'Se um utilizador com este email existir, um link para redefinir a senha foi enviado.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await db.updateTable('users')
      .set({ password_reset_token: passwordResetToken, password_reset_expires: passwordResetExpires })
      .where('id', '=', user.id)
      .execute();

    // In a real app, you'd use the domain of your frontend.
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({ message: 'Se um utilizador com este email existir, um link para redefinir a senha foi enviado.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues.map(e => e.message).join(', ') });
      return;
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Erro ao processar o pedido de redefinição de senha.' });
  }
});

const resetPasswordSchema = z.object({
  token: z.string().nonempty(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await db.selectFrom('users')
      .where('password_reset_token', '=', hashedToken)
      .where('password_reset_expires', '>', new Date().toISOString())
      .select('id')
      .executeTakeFirst();

    if (!user) {
      res.status(400).json({ message: 'Token inválido ou expirado.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.updateTable('users')
      .set({
        password_hash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .where('id', '=', user.id)
      .execute();

    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues.map(e => e.message).join(', ') });
      return;
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Erro ao redefinir a senha.' });
  }
});

export default router;
