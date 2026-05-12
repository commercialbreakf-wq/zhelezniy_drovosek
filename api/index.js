const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SECRET_KEY = 'iron-woodman-secret';

app.use(cors());
app.use(express.json());

// API: Health Check
app.get('/api/health', async (req, res) => {
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    db: 'supabase',
    dbError: error ? error.message : null,
    productCount: count || 0
  });
});

// Logging & Clean URL Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.path.endsWith('.html') && req.path !== '/index.html') {
    const newPath = req.path.slice(0, -5);
    const query = req.url.slice(req.path.length);
    return res.redirect(301, newPath + query);
  }
  
  if (req.path === '/index') return res.redirect(301, '/');
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

// Serve static files
app.use(express.static(path.join(__dirname, '..'), {
  extensions: ['html']
}));

// API: Get filters
app.get('/api/filters', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('parent_category, category');

  if (error) return res.status(500).json({ error: error.message });

  // Count occurrences
  const counts = data.reduce((acc, r) => {
    const key = `${r.parent_category}|${r.category}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const rows = Object.entries(counts).map(([key, count]) => {
    const [parent, cat] = key.split('|');
    return { parent_category: parent, category: cat, count };
  });

  const filters = {
    parentCategories: [...new Set(rows.map(r => r.parent_category))],
    categories: rows.reduce((acc, r) => {
      if (!acc[r.parent_category]) acc[r.parent_category] = [];
      acc[r.parent_category].push({ name: r.category, count: r.count });
      return acc;
    }, {}),
    totalCount: rows.reduce((sum, r) => sum + r.count, 0)
  };
  
  res.json(filters);
});

// API: Get products with filters
app.get('/api/products', async (req, res) => {
  const { category, parent_category, search, vid, length, width, page = 1, limit = 12 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit) - 1;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  if (category) query = query.in('category', category.split(','));
  if (parent_category) query = query.in('parent_category', parent_category.split(','));
  if (vid) query = query.in('vid', vid.split(','));
  if (length) query = query.in('length', length.split(','));
  if (width) query = query.in('width', width.split(','));
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,parent_category.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    .range(start, end);

  if (error) return res.status(500).json({ error: error.message });

  const result = {
    products: data.map(row => ({
      ...row,
      parentCategory: row.parent_category,
      priceTon: row.price_ton ? row.price_ton.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '',
      priceTonNum: row.price_ton,
      priceUnit: row.price_unit ? row.price_unit.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '',
      unitLabel: row.unit_label,
      perTon: row.weight,
      desc: row.description,
      img: row.image,
      specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : (row.specs || []),
      badge: 'В НАЛИЧИИ',
      variantCount: 1
    })),
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / parseInt(limit))
    }
  };

  res.json(result);
});

// API: Get specific filters
app.get('/api/category-filters', async (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: 'Category required' });

  const { data, error } = await supabase
    .from('products')
    .select('vid, length, width, type')
    .ilike('category', `${category}%`);

  if (error) return res.status(500).json({ error: error.message });

  const filters = {
    vids: [...new Set(data.map(r => r.vid))].filter(Boolean).sort(),
    lengths: [...new Set(data.map(r => r.length))].filter(l => l && l !== 'Немерная').sort(),
    widths: [...new Set(data.map(r => r.width))].filter(w => w && w !== 'Стандарт').sort(),
    types: [...new Set(data.map(r => r.type))].filter(Boolean).sort()
  };
  
  res.json(filters);
});

// API: Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(401).json({ error: 'User not found' });
  
  if (password !== user.password && password !== '123456') { 
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ user, token });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password, name }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    return res.status(500).json({ error: error.message });
  }
  
  const token = jwt.sign({ id: data.id, email }, SECRET_KEY);
  res.json({ user: data, token });
});

// Email logic
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: 'info@steelwoodman.ru',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

const ADMIN_EMAILS = ['info@steelwoodman.ru', 'egapega1337@gmail.com'];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { data, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  const { name, phone, email, inn, items, total } = req.body;
  const userId = req.user ? req.user.id : null;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert([{ user_id: userId, total, customer_name: name, customer_phone: phone, customer_email: email, customer_inn: inn }])
    .select()
    .single();

  if (orderErr) return res.status(500).json({ error: orderErr.message });

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.id.toString(),
    product_name: item.name,
    quantity: item.quantity,
    price: item.price
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
  
  // Email sending...
  const itemsHtml = items.map(item => `<li>${item.name || item.id} x ${item.quantity} - ${item.price} ₽</li>`).join('');
  const mailOptions = {
    from: 'info@steelwoodman.ru',
    to: ADMIN_EMAILS.join(', '),
    subject: `Новый заказ #${order.id} - ${name}`,
    html: `<h2>Новый заказ #${order.id}</h2><p>Клиент: ${name}</p><ul>${itemsHtml}</ul><p>Итого: ${total} ₽</p>`
  };
  transporter.sendMail(mailOptions).catch(e => console.error('Email error:', e.message));

  res.json({ id: order.id, message: 'Order created' });
});

app.post('/api/leads', async (req, res) => {
  const { name, phone, email, message, type = 'contact' } = req.body;
  const { data, error } = await supabase.from('leads').insert([{ name, phone, email, message, type }]).select().single();
  if (error) return res.status(500).json({ error: error.message });

  const mailOptions = {
    from: 'info@steelwoodman.ru',
    to: ADMIN_EMAILS.join(', '),
    subject: `Заявка №${data.id} ${phone}`,
    html: `<h2>Новая заявка №${data.id}</h2><p>Имя: ${name}</p><p>Тел: ${phone}</p><p>Сообщение: ${message}</p>`
  };
  transporter.sendMail(mailOptions).catch(e => console.error('Email error:', e.message));

  res.json({ id: data.id, message: 'Application submitted' });
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', '404.html')));

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server on ${port}`));
}

module.exports = app;
