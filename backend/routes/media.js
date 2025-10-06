const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');

const router = express.Router();

const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsRoot);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', auth(), upload.array('files', 10), async (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({
      id: f.filename,
      url: `${process.env.APP_BASE_URL || ''}/uploads/${f.filename}`,
      name: f.originalname,
      type: f.mimetype,
      size: f.size,
    }));
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.delete('/:id', auth(), async (req, res) => {
  try {
    const file = path.join(uploadsRoot, req.params.id);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;

