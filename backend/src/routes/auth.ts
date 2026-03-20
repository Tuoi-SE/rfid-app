import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rfid_inventory_secret_key';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

export default router;
