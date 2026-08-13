import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, randomInt } from 'crypto';
import User from '../models/User';

const GMAIL_SCOPE = 'https://mail.google.com/';
const gmailSetupStates = new Map<string, number>();

const getGoogleLoginClient = (): OAuth2Client => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getGmailOAuthClient = (): OAuth2Client => {
  const { GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REDIRECT_URI } = process.env;
  if (!GMAIL_OAUTH_CLIENT_ID || !GMAIL_OAUTH_CLIENT_SECRET || !GMAIL_OAUTH_REDIRECT_URI) {
    throw new Error('Gmail OAuth is not fully configured');
  }
  return new OAuth2Client(GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REDIRECT_URI);
};

const isMailConfigured = (): boolean => Boolean(
  process.env.EMAIL_USER &&
  process.env.GMAIL_OAUTH_CLIENT_ID &&
  process.env.GMAIL_OAUTH_CLIENT_SECRET &&
  process.env.GMAIL_OAUTH_REFRESH_TOKEN,
);

const getMailTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
    clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
  },
});

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id }, secret, {
    expiresIn: '7d',
  });
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const isValidPassword = (password: unknown): password is string =>
  typeof password === 'string' && password.length >= 8;

const userResponse = (user: InstanceType<typeof User>) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  token: generateToken(user.id),
});

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof email !== 'string' || !isValidPassword(password)) {
      res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required' });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword });
    res.status(201).json(userResponse(user));
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.status(200).json(userResponse(user));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// 1. Send OTP to Email
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ message: 'A valid email is required' });
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.status(200).json({ message: 'If that account exists, a recovery code has been sent.' });

    if (!isMailConfigured()) {
      res.status(503).json({ message: 'Password recovery email is not configured' });
      return;
    }

    // Generate 6-digit OTP
    const otp = randomInt(100000, 1000000).toString();
    user.resetOtpHash = await bcrypt.hash(otp, 10);
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    await getMailTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    });

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
};

// 2. Verify OTP & Reset Password
export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string' || !isValidPassword(password)) {
      res.status(400).json({ message: 'A valid email, OTP, and password of at least 8 characters are required' });
      return;
    }
    const user = await User.findOne({ email: normalizeEmail(email), resetOtpExpiry: { $gt: new Date() } });

    if (!user || !user.resetOtpHash || !(await bcrypt.compare(otp, user.resetOtpHash))) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetOtpHash = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Google OAuth Login/Signup
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (typeof token !== 'string') return res.status(400).json({ message: 'Google credential is required' });
    const ticket = await getGoogleLoginClient().verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ message: 'Invalid Google Token' });

    const { email, name, sub: googleId, email_verified: emailVerified } = payload;
    if (!email || !googleId || !emailVerified) return res.status(400).json({ message: 'Google account email is not verified' });

    const normalizedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Create new user if they don't exist (no password needed for Google Auth)
      user = await User.create({ name: name || normalizedEmail.split('@')[0], email: normalizedEmail, googleId });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    res.status(200).json(userResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// Gmail sending-account setup: visit this endpoint once from a private local browser.
// The refresh token is only written to the server console; put it in server/.env manually.
export const startGmailOAuthSetup = (req: Request, res: Response): void => {
  try {
    if (!process.env.GMAIL_OAUTH_SETUP_SECRET || req.query.setupKey !== process.env.GMAIL_OAUTH_SETUP_SECRET) {
      res.status(403).send('Invalid Gmail OAuth setup key.');
      return;
    }

    const state = randomBytes(32).toString('hex');
    gmailSetupStates.set(state, Date.now() + 10 * 60 * 1000);
    const authorizationUrl = getGmailOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [GMAIL_SCOPE],
      state,
    });
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Unable to start Gmail OAuth setup:', error);
    res.status(500).send('Gmail OAuth setup is not configured correctly.');
  }
};

export const completeGmailOAuthSetup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      res.status(400).send(`Google authorization was not completed: ${error}`);
      return;
    }
    if (typeof code !== 'string' || typeof state !== 'string' || !gmailSetupStates.get(state) || gmailSetupStates.get(state)! < Date.now()) {
      res.status(400).send('This Gmail OAuth setup link is invalid or has expired. Start again.');
      return;
    }
    gmailSetupStates.delete(state);

    const { tokens } = await getGmailOAuthClient().getToken(code);
    if (!tokens.refresh_token) {
      res.status(400).send('Google did not return a refresh token. Revoke this app in your Google Account, then start setup again.');
      return;
    }

    console.log('\nGmail OAuth setup succeeded. Add this to server/.env, then restart the server:');
    console.log(`GMAIL_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    res.type('html').send('<h1>Gmail OAuth connected</h1><p>The refresh token was printed only in your server terminal. Add it to <code>server/.env</code>, then restart the server.</p>');
  } catch (error) {
    console.error('Unable to complete Gmail OAuth setup:', error);
    res.status(500).send('Gmail OAuth setup failed. Check the server terminal for details.');
  }
};
