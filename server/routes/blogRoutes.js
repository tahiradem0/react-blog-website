const express = require('express');
const multer = require('multer');
const Blog = require('../models/Blog');
const authMiddleware = require('../middlewares/authMiddleware');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Multer memory storage for Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create blog - Fixed version
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, content, category } = req.body;
    let imageId = '';

    if (req.file) {
      // Convert to promise-based upload
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'blogs' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageId = result.public_id;
    }

    const blog = new Blog({
      title,
      description,
      content,
      category,
      image: imageId,
      author: req.user._id
    });

    await blog.save();
    await blog.populate('author', 'name');

    res.status(201).json({ message: 'Blog created successfully', blog });
  } catch (error) {
    console.error('Blog creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update blog - Fixed version
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized to edit this blog' });

    const { title, description, content, category, removeImage } = req.body;

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.content = content || blog.content;
    blog.category = category || blog.category;

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (blog.image) {
        try {
          await cloudinary.uploader.destroy(blog.image);
        } catch (deleteError) {
          console.log('Error deleting old image:', deleteError);
          // Continue with upload even if deletion fails
        }
      }
      
      // Upload new image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'blogs' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      blog.image = result.public_id;
    } else if (removeImage === 'true' || removeImage === true) {
      if (blog.image) {
        try {
          await cloudinary.uploader.destroy(blog.image);
        } catch (deleteError) {
          console.log('Error deleting image:', deleteError);
        }
      }
      blog.image = '';
    }

    await blog.save();
    await blog.populate('author', 'name');

    res.json({ message: 'Blog updated successfully', blog });
  } catch (error) {
    console.error('Blog update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve images to frontend (keeps URL pattern the same)
router.get('/uploads/:imageId', (req, res) => {
  const { imageId } = req.params;
  if (!imageId) return res.status(404).send('Image not found');

  const url = cloudinary.url(imageId, { secure: true });
  res.redirect(url); // frontend calls /uploads/:imageId
});

// Get all blogs
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

    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like blog
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const hasLiked = blog.likes.includes(req.user._id);
    if (hasLiked) {
      blog.likes = blog.likes.filter(like => like.toString() !== req.user._id.toString());
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({ message: hasLiked ? 'Blog unliked' : 'Blog liked', likes: blog.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const comment = { user: req.user._id, text, name: req.user.name };
    blog.comments.push(comment);
    await blog.save();

    res.json({ message: 'Comment added successfully', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
