const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Blog = require('../models/Blog');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (no temporary files)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
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

// Helper function to upload image to Cloudinary from memory buffer
const uploadToCloudinaryFromBuffer = async (fileBuffer, originalname) => {
  try {
    console.log('Uploading to Cloudinary from buffer...');
    
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'blog-images',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ],
          public_id: `blog_${Date.now()}_${path.parse(originalname).name}`
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary stream error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      stream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (image) => {
  try {
    if (!image) return;
    
    if (typeof image === 'object' && image.public_id) {
      // New format: { url: '', public_id: '' }
      await cloudinary.uploader.destroy(image.public_id);
    } else if (typeof image === 'string' && image.includes('cloudinary')) {
      // Old format: string URL - try to extract public_id
      const urlParts = image.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      const fullPublicId = `blog-images/${publicId}`;
      await cloudinary.uploader.destroy(fullPublicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

// Test Cloudinary connection endpoint
router.get('/test/cloudinary', async (req, res) => {
  try {
    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    console.log('Cloudinary ping result:', result);
    
    res.json({ 
      message: 'Cloudinary connection test',
      cloudinary: result,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
        api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    res.status(500).json({ 
      message: 'Cloudinary test failed',
      error: error.message 
    });
  }
});

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
    console.error('Error fetching blogs:', error);
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
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blog (protected) - UPDATED WITH MEMORY BUFFER
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('Request received for blog creation');
    console.log('Request body:', req.body);
    console.log('Request file info:', req.file ? {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferLength: req.file.buffer.length
    } : 'No file');

    const { title, description, content, category } = req.body;

    // Validate required fields
    if (!title || !description || !content || !category) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    const blogData = {
      title,
      description,
      content,
      category,
      author: req.user._id
    };

    // If image was uploaded, upload to Cloudinary from memory buffer
    if (req.file) {
      console.log('Image file detected, uploading to Cloudinary from buffer...');
      try {
        const result = await uploadToCloudinaryFromBuffer(req.file.buffer, req.file.originalname);
        
        blogData.image = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ 
          message: 'Error uploading image to Cloudinary',
          details: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        });
      }
    } else {
      console.log('No image file detected');
    }

    const blog = new Blog(blogData);
    await blog.save();
    await blog.populate('author', 'name');

    console.log('Blog created successfully');
    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    console.error('Error liking blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

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

    // Populate the new comment's user field
    await blog.populate('comments.user', 'name');

    // Get the newly added comment
    const newComment = blog.comments[blog.comments.length - 1];

    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update blog (protected) - UPDATED WITH MEMORY BUFFER
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

    // Update blog fields
    if (title) blog.title = title;
    if (description) blog.description = description;
    if (content) blog.content = content;
    if (category) blog.category = category;

    // Handle image update
    if (req.file) {
      try {
        // Upload new image to Cloudinary from memory buffer
        const result = await uploadToCloudinaryFromBuffer(req.file.buffer, req.file.originalname);
        
        // Delete old image from Cloudinary if it exists
        await deleteFromCloudinary(blog.image);
        
        // Add new image data
        blog.image = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ message: 'Error uploading image' });
      }
    } else if (req.body.removeImage === 'true') {
      // Delete image from Cloudinary if it exists
      await deleteFromCloudinary(blog.image);
      blog.image = undefined;
    }

    await blog.save();
    await blog.populate('author', 'name');

    res.json({
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete blog (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user owns the blog
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    // Delete image from Cloudinary if it exists
    await deleteFromCloudinary(blog.image);

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blogs by user (optional)
router.get('/user/my-blogs', authMiddleware, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;