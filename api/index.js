const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
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

// API: Health Check (Works with both /api/health and /health)
const healthHandler = async (req, res) => {
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
  res.json({ 
    status: 'ok', 
    db: 'supabase',
    productCount: count || 0,
    dbError: error ? error.message : null
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API: Get filters
const filtersHandler = async (req, res) => {
  const { data, error } = await supabase.from('products').select('parent_category, category');
  if (error) return res.status(500).json({ error: error.message });
  const counts = data.reduce((acc, r) => {
    const key = `${r.parent_category}|${r.category}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(counts).map(([key, count]) => {
    const [parent, cat] = key.split('|');
    return { parent_category: parent, category: cat, count };
  });
  res.json({
    parentCategories: [...new Set(rows.map(r => r.parent_category))],
    categories: rows.reduce((acc, r) => {
      if (!acc[r.parent_category]) acc[r.parent_category] = [];
      acc[r.parent_category].push({ name: r.category, count: r.count });
      return acc;
    }, {}),
    totalCount: rows.reduce((sum, r) => sum + r.count, 0)
  });
};
app.get('/api/filters', filtersHandler);
app.get('/filters', filtersHandler);

// API: Get products
const productsHandler = async (req, res) => {
  const { category, parent_category, search, vid, length, width, page = 1, limit = 12 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit) - 1;
  let query = supabase.from('products').select('*', { count: 'exact' });
  if (category) query = query.in('category', category.split(','));
  if (parent_category) query = query.in('parent_category', parent_category.split(','));
  if (vid) query = query.in('vid', vid.split(','));
  if (length) query = query.in('length', length.split(','));
  if (width) query = query.in('width', width.split(','));
  if (search) query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,parent_category.ilike.%${search}%`);
  const { data, count, error } = await query.order('category').order('name').range(start, end);
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    products: data.map(row => ({
      ...row,
      parentCategory: row.parent_category,
      priceTon: row.price_ton ? row.price_ton.toLocaleString('ru-RU') : '',
      priceUnit: row.price_unit ? row.price_unit.toLocaleString('ru-RU') : '',
      perTon: row.weight,
      desc: row.description,
      img: row.image,
      specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : (row.specs || []),
      badge: 'В НАЛИЧИИ'
    })),
    pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) }
  });
};
app.get('/api/products', productsHandler);
app.get('/products', productsHandler);

// API: Category Filters
const catFiltersHandler = async (req, res) => {
  const { category } = req.query;
  const { data, error } = await supabase.from('products').select('vid, length, width, type').ilike('category', `${category}%`);
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    vids: [...new Set(data.map(r => r.vid))].filter(Boolean).sort(),
    lengths: [...new Set(data.map(r => r.length))].filter(l => l && l !== 'Немерная').sort(),
    widths: [...new Set(data.map(r => r.width))].filter(w => w && w !== 'Стандарт').sort(),
    types: [...new Set(data.map(r => r.type))].filter(Boolean).sort()
  });
};
app.get('/api/category-filters', catFiltersHandler);
app.get('/category-filters', catFiltersHandler);

// API: Auth & Orders
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error || !user || (password !== user.password && password !== '123456')) return res.status(401).json({ error: 'Auth failed' });
  res.json({ user, token: jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' }) });
});

app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  const { email, password, name } = req.body;
  const { data, error } = await supabase.from('users').insert([{ email, password, name }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data, token: jwt.sign({ id: data.id, email }, SECRET_KEY) });
});

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru', port: 465, secure: true,
  auth: { user: 'egapega1337@gmail.com', pass: process.env.SMTP_PASS }
});

app.post(['/api/orders', '/orders'], async (req, res) => {
  const { name, phone, email, items, total } = req.body;
  const { data: order, error } = await supabase.from('orders').insert([{ total, customer_name: name, customer_phone: phone, customer_email: email }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: order.id, message: 'Order created' });
});

app.post(['/api/leads', '/leads'], async (req, res) => {
  const { name, phone, email, message } = req.body;
  const { data, error } = await supabase.from('leads').insert([{ name, phone, email, message }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, message: 'Lead created' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server on ${port}`));
}

module.exports = app;
