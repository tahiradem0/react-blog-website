const express = require('express');
const multer = require('multer');
const path = require('path');
const Blog = require('../models/Blog');
const authMiddleware = require('../middlewares/authMiddleware');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const router = express.Router();

// Multer configuration for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ✅ Cloudinary upload helper
const uploadToCloudinary = async (localPath) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'blog_images',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    // Clean up local file
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    
    // Clean up local file even on error
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    throw new Error("Image upload failed");
  }
};

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
    console.error('Get blogs error:', error);
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
    console.error('Get single blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blog route (with Cloudinary upload)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, content, category } = req.body;
    
    // Validation
    if (!title || !description || !content) {
      return res.status(400).json({ message: 'Title, description, and content are required' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path);
    }

    const blog = new Blog({
      title,
      description,
      content,
      category,
      image: imageUrl,
      author: req.user._id
    });

    await blog.save();
    await blog.populate('author', 'name');

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    
    // Clean up uploaded file if blog creation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.message === 'Image upload failed') {
      return res.status(400).json({ message: 'Image upload failed' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Update blog route (with Cloudinary upload)
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

    const { title, description, content, category, removeImage } = req.body;

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.content = content || blog.content;
    blog.category = category || blog.category;

    // Handle image updates
    if (req.file) {
      blog.image = await uploadToCloudinary(req.file.path);
    } else if (removeImage === 'true' || removeImage === true) {
      blog.image = '';
    }

    blog.updatedAt = Date.now();
    await blog.save();
    await blog.populate('author', 'name');

    res.json({
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.message === 'Image upload failed') {
      return res.status(400).json({ message: 'Image upload failed' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blog route
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user owns the blog or is admin
    if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    // Optional: Delete image from Cloudinary if you want to clean up
    // You can implement this later if needed

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
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
    console.error('Like blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      name: req.user.name
    };

    blog.comments.push(comment);
    await blog.save();

    // Populate the new comment with user info
    await blog.populate('comments.user', 'name');

    // Get the newly added comment
    const newComment = blog.comments[blog.comments.length - 1];

    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:id/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = blog.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    blog.comments.pull(req.params.commentId);
    await blog.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

module.exports = router;