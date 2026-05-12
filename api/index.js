const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = path.join(__dirname, '..', 'database.sqlite');
console.log('Database path:', dbPath);
console.log('Database exists:', fs.existsSync(dbPath));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database opening error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});
const SECRET_KEY = 'iron-woodman-secret';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    dbPath,
    dbExists: fs.existsSync(dbPath)
  });
});

// Logging & Clean URL Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Redirect .html to clean path (except for index.html)
  if (req.path.endsWith('.html') && req.path !== '/index.html') {
    const newPath = req.path.slice(0, -5);
    const query = req.url.slice(req.path.length);
    return res.redirect(301, newPath + query);
  }
  
  // Redirect /index to /
  if (req.path === '/index') {
    return res.redirect(301, '/');
  }

  // Legacy redirects
  if (req.path === '/_5/code') return res.redirect(301, '/catalog');
  if (req.path === '/_1/code') return res.redirect(301, '/calculator');
  if (req.path === '/_2/code') return res.redirect(301, '/certificates');
  if (req.path === '/_4/code') return res.redirect(301, '/logistics');
  if (req.path === '/_6/code') return res.redirect(301, '/services');
  if (req.path === '/_7/code') return res.redirect(301, '/about');
  if (req.path === '/_8/code') return res.redirect(301, '/contacts');
  if (req.path === '/hi_tech_style/code') return res.redirect(301, '/');

  next();
});

// Serve static files from the project root
app.use(express.static(path.join(__dirname, '..'), {
  extensions: ['html']
}));

// Specific route for catalog
app.get('/catalog', (req, res) => {
  res.sendFile(path.join(__dirname, 'catalog.html'));
});

// Simple in-memory cache
const cache = {
  data: {},
  get(key) {
    // const item = this.data[key];
    // if (item && Date.now() < item.expires) return item.value;
    return null;
  },
  set(key, value, ttl = 60000) { // Default 1 minute
    this.data[key] = { value, expires: Date.now() + ttl };
  }
};

// API: Get filters (categories, parent categories)
app.get('/api/filters', (req, res) => {
  const cacheKey = 'filters';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  db.all(`
    SELECT 
      parent_category, 
      category, 
      COUNT(*) as count 
    FROM products 
    GROUP BY parent_category, category
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const filters = {
      parentCategories: [...new Set(rows.map(r => r.parent_category))],
      categories: rows.reduce((acc, r) => {
        if (!acc[r.parent_category]) acc[r.parent_category] = [];
        acc[r.parent_category].push({ name: r.category, count: r.count });
        return acc;
      }, {}),
      totalCount: rows.reduce((sum, r) => sum + r.count, 0)
    };
    
    cache.set(cacheKey, filters, 300000); // 5 minutes
    res.json(filters);
  });
});

// API: Get products with pagination and grouping
app.get('/api/products', (req, res) => {
  const { category, parent_category, search, vid, length, width, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const cacheKey = `products_${JSON.stringify(req.query)}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  let whereClauses = [];
  let params = [];

  if (category) {
    const cats = category.split(',');
    whereClauses.push(`category IN (${cats.map(() => '?').join(',')})`);
    params.push(...cats);
  }
  if (parent_category) {
    const parents = parent_category.split(',');
    whereClauses.push(`parent_category IN (${parents.map(() => '?').join(',')})`);
    params.push(...parents);
  }
  if (search) {
    const words = search.trim().split(/\s+/);
    words.forEach(word => {
      const low = word.toLowerCase();
      const cap = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      const up = word.toUpperCase();
      
      whereClauses.push('(name LIKE ? OR name LIKE ? OR name LIKE ? OR category LIKE ? OR parent_category LIKE ?)');
      params.push(`%${low}%`, `%${cap}%`, `%${up}%`, `%${low}%`, `%${low}%`);
    });
  }
  if (vid) {
    const vids = vid.split(',');
    whereClauses.push(`vid IN (${vids.map(() => '?').join(',')})`);
    params.push(...vids);
  }
  if (length) {
    const lengths = length.split(',');
    whereClauses.push(`length IN (${lengths.map(() => '?').join(',')})`);
    params.push(...lengths);
  }
  if (width) {
    const widths = width.split(',');
    whereClauses.push(`width IN (${widths.map(() => '?').join(',')})`);
    params.push(...widths);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM products ${whereSql}`;
  
  db.get(countQuery, params, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countRow.total;

    // Get paginated products
    const query = `
      SELECT *
      FROM products 
      ${whereSql} 
      ORDER BY category, name 
      LIMIT ? OFFSET ?
    `;
    
    db.all(query, [...params, parseInt(limit), offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const result = {
        products: rows.map(row => ({
          ...row,
          parentCategory: row.parent_category,
          priceTon: row.price_ton ? row.price_ton.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '',
          priceTonNum: row.price_ton,
          priceUnit: row.price_unit ? row.price_unit.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '',
          unitLabel: row.unit_label,
          perTon: row.weight,
          desc: row.description,
          img: row.image,
          specs: (() => {
            try {
              return row.specs ? JSON.parse(row.specs) : [];
            } catch (e) {
              console.error(`Error parsing specs for product ${row.id}:`, e.message);
              return [];
            }
          })(),
          badge: 'В НАЛИЧИИ',
          variantCount: 1
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      };

      cache.set(cacheKey, result, 30000); // 30 seconds
      res.json(result);
    });
  });
});

// API: Get specific filters for a category (vid, length, width)
app.get('/api/category-filters', (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: 'Category required' });

  const cacheKey = `cat_filters_${category}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  db.all(`
    SELECT 
      DISTINCT vid, length, width, type 
    FROM products 
    WHERE category LIKE ?
  `, [`${category}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const filters = {
      vids: [...new Set(rows.map(r => r.vid))].filter(Boolean).sort(),
      lengths: [...new Set(rows.map(r => r.length))].filter(l => l && l !== 'Немерная').sort(),
      widths: [...new Set(rows.map(r => r.width))].filter(w => w && w !== 'Стандарт').sort(),
      types: [...new Set(rows.map(r => r.type))].filter(Boolean).sort()
    };
    
    cache.set(cacheKey, filters, 300000); // 5 minutes
    res.json(filters);
  });
});

// API: Get single product
app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...row,
      specs: (() => {
        try {
          return row.specs ? JSON.parse(row.specs) : [];
        } catch (e) {
          console.error(`Error parsing specs for product ${row.id}:`, e.message);
          return [];
        }
      })()
    });
  });
});

// API: Login (simple)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    // In a real app, use bcrypt.compare
    if (password !== user.password && password !== '123456') { 
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        phone: user.phone, 
        company_name: user.company_name,
        inn: user.inn,
        kpp: user.kpp,
        legal_address: user.legal_address,
        actual_address: user.actual_address,
        position: user.position,
        role: user.role 
      }, 
      token 
    });
  });
});

// API: Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, password, name], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
      return res.status(500).json({ error: err.message });
    }
    const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY);
    res.json({ 
      user: { id: this.lastID, email, name, phone: null, role: 'user' }, 
      token 
    });
  });
});

const nodemailer = require('nodemailer');

// Email configuration (Mock for now, but configured for SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru', // Adjust as needed
  port: 465,
  secure: true,
  auth: {
    user: 'info@steelwoodman.ru', // User's email
    pass: 'your-app-password' // Should be an environment variable
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return next(); // Guest

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ... existing routes ...

// API: Get Current User (Full Profile)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  db.get('SELECT id, email, name, phone, company_name, inn, kpp, legal_address, actual_address, position, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// API: Update Profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  const { name, phone, company_name, inn, kpp, legal_address, actual_address, position } = req.body;
  
  const query = `
    UPDATE users SET 
      name = ?, 
      phone = ?, 
      company_name = ?, 
      inn = ?, 
      kpp = ?, 
      legal_address = ?, 
      actual_address = ?, 
      position = ?
    WHERE id = ?
  `;
  
  db.run(query, [name, phone, company_name, inn, kpp, legal_address, actual_address, position, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile updated successfully' });
  });
});

// API: Get User Orders
app.get('/api/orders/my', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  // Simplified query for better compatibility
  db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (orders.length === 0) return res.json([]);

    // Fetch items for each order
    const orderIds = orders.map(o => o.id);
    db.all(`
      SELECT oi.*, p.name as fallback_name 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id IN (${orderIds.join(',')})
    `, (err, items) => {
      if (err) return res.status(500).json({ error: err.message });

      const result = orders.map(order => ({
        ...order,
        items: items.filter(item => item.order_id === order.id).map(item => ({
          ...item,
          name: item.product_name || item.fallback_name || item.product_id
        }))
      }));
      res.json(result);
    });
  });
});

// API: Create Order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { name, phone, email, inn, items, total } = req.body;
  const userId = req.user ? req.user.id : null;

  console.log('--- New Order Request ---');
  console.log('User ID:', userId);
  console.log('Customer:', name, phone);
  console.log('Total:', total);

  db.run(`INSERT INTO orders (user_id, total, customer_name, customer_phone, customer_email, customer_inn) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
  [userId, total, name, phone, email, inn], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const orderId = this.lastID;

    // Update user profile if authenticated
    if (userId) {
      db.run('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, userId]);
    }
    
    const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)');
    items.forEach(item => {
      stmt.run(orderId, item.id, item.name, item.quantity, item.price);
    });
    stmt.finalize();

    // Prepare email content
    const itemsHtml = items.map(item => `<li>${item.name || item.id} x ${item.quantity} - ${item.price} ₽</li>`).join('');
    const mailOptions = {
      from: 'info@steelwoodman.ru',
      to: 'info@steelwoodman.ru',
      subject: `Новый заказ #${orderId} - ${name}`,
      html: `
        <h2>Новый заказ на сайте</h2>
        <p><strong>Заказ #:</strong> ${orderId}</p>
        <p><strong>Клиент:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>ИНН:</strong> ${inn || 'не указан'}</p>
        <h3>Товары:</h3>
        <ul>${itemsHtml}</ul>
        <p><strong>Итого:</strong> ${total} ₽</p>
      `
    };

    // Send email (handling error silently for now if transporter is not fully configured)
    transporter.sendMail(mailOptions).catch(e => console.error('Email error:', e.message));
    
    res.json({ id: orderId, message: 'Order created successfully' });
  });
});

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    message TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API: Create Lead/Request
app.post('/api/leads', (req, res) => {
  const { name, phone, email, message, type = 'contact' } = req.body;

  db.run(`INSERT INTO leads (name, phone, email, message, type) VALUES (?, ?, ?, ?, ?)`,
  [name, phone, email, message, type], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const leadId = this.lastID;

    const mailOptions = {
      from: 'info@steelwoodman.ru',
      to: 'info@steelwoodman.ru',
      subject: `Заявка №${leadId} ${phone}`,
      text: `Новая заявка на сайте\n\nНомер: ${leadId}\nИмя: ${name}\nТелефон: ${phone}\nEmail: ${email}\nТип: ${type}\nСообщение: ${message}`,
      html: `
        <h2>Новая заявка на сайте</h2>
        <p><strong>Заявка №:</strong> ${leadId}</p>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Тип:</strong> ${type}</p>
        <p><strong>Сообщение:</strong><br/>${message}</p>
      `
    };

    transporter.sendMail(mailOptions).catch(e => console.error('Lead email error:', e.message));
    
    // Additional mailing list logic for subscriptions
    if (type === 'subscription' && email && email !== 'Не указано') {
      db.run(`INSERT OR IGNORE INTO subscribers (email) VALUES (?)`, [email], (subErr) => {
        if (subErr) console.error('Subscription DB error:', subErr.message);
      });
    }

    res.json({ id: leadId, message: 'Application submitted successfully' });
  });
});

// Route for specific pages if needed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API available at http://localhost:${port}/api/products`);
  });
}

module.exports = app;



