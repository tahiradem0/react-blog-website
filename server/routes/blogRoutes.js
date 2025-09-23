const express = require('express');
const multer = require('multer');
const path = require('path');
const Blog = require('../models/Blog');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all blogs with search and category filter
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name')
      .populate('comments.user', 'name');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blog (protected)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, content, category } = req.body;

    const blog = new Blog({
      title,
      description,
      content,
      category,
      image: req.file ? req.file.filename : '',
      author: req.user._id
    });

    await blog.save();
    await blog.populate('author', 'name');

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like blog
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const hasLiked = blog.likes.includes(req.user._id);
    
    if (hasLiked) {
      blog.likes = blog.likes.filter(like => like.toString() !== req.user._id.toString());
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({
      message: hasLiked ? 'Blog unliked' : 'Blog liked',
      likes: blog.likes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = {
      user: req.user._id,
      text,
      name: req.user.name
    };

    blog.comments.push(comment);
    await blog.save();

    res.json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this route to blogRoutes.js
// Update blog (protected)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user owns the blog
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this blog' });
    }

    const { title, description, content, category } = req.body;

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.content = content || blog.content;
    blog.category = category || blog.category;

    // Handle image update
    if (req.file) {
      blog.image = req.file.filename;
    } else if (req.body.removeImage) {
      blog.image = '';
    }

    await blog.save();
    await blog.populate('author', 'name');

    res.json({
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;