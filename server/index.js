const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const pool = require('./models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const secret = 'your-secret-key';

app.use(cors());
app.use(express.json());

// Регистрация
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );
        await pool.query('INSERT INTO progress (user_id) VALUES ($1)', [result.rows[0].id]);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Логин
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Middleware для проверки токена
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    jwt.verify(token, secret, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

// Квесты
app.get('/quests', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quests WHERE user_id = $1', [req.userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/quests', authenticate, async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO quests (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
            [req.userId, title, description || '']
        );
        await pool.query('UPDATE progress SET quest_count = quest_count + 1 WHERE user_id = $1', [req.userId]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/quests/:id', authenticate, async (req, res) => {
    const { is_boss, boss_health } = req.body;
    try {
        const result = await pool.query(
            'UPDATE quests SET is_boss = $1, boss_health = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [is_boss, boss_health, req.params.id, req.userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Задачи
app.get('/tasks/:questId', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE quest_id = $1', [req.params.questId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/tasks', authenticate, async (req, res) => {
    const { quest_id, description } = req.body;
    if (!quest_id || !description) {
        return res.status(400).json({ error: 'Quest ID and description are required' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO tasks (quest_id, description) VALUES ($1, $2) RETURNING *',
            [quest_id, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/tasks/:id', authenticate, async (req, res) => {
    const { description, is_completed } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET description = $1, is_completed = $2 WHERE id = $3 RETURNING *',
            [description, is_completed, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Достижения
app.get('/achievements', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM achievements WHERE user_id = $1', [req.userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/achievements', authenticate, async (req, res) => {
    const { title, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO achievements (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
            [req.userId, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Прогресс
app.get('/progress', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT quest_count FROM progress WHERE user_id = $1', [req.userId]);
        res.json(result.rows[0] || { quest_count: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Чат
app.get('/chat/history', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT u.username, c.message, c.created_at FROM chat_messages c JOIN users u ON c.user_id = u.id ORDER BY c.created_at');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        const token = data.token;
        const decoded = jwt.verify(token, secret);
        const userId = decoded.id;
        const result = await pool.query(
            'INSERT INTO chat_messages (user_id, message) VALUES ($1, $2) RETURNING *',
            [userId, data.message]
        );
        const msg = result.rows[0];
        const usernameResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        const username = usernameResult.rows[0].username;
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ username, message: msg.message, created_at: msg.created_at }));
            }
        });
    });
});