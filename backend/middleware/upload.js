const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * File Upload Middleware
 * Handles file uploads with local storage (S3 optional)
 */

// =============================================================================
// DIRECTORY SETUP
// =============================================================================

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(__dirname, '..', 'uploads'),
  path.join(__dirname, '..', 'uploads', 'pitchdecks'),
  path.join(__dirname, '..', 'uploads', 'resources'),
  path.join(__dirname, '..', 'uploads', 'avatars'),
];

uploadDirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload directory: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ Error creating directory ${dir}:`, error.message);
  }
});

// =============================================================================
// FILE TYPE VALIDATION
// =============================================================================

/**
 * Allowed file types by category
 */
const allowedTypes = {
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
    mimetypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimetypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  all: {
    extensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimetypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
  },
};

/**
 * Create file filter based on allowed types
 * @param {string} category - Category of files to allow
 * @returns {Function} Multer file filter function
 */
const createFileFilter = (category = 'documents') => {
  const types = allowedTypes[category] || allowedTypes.documents;

  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidExt = types.extensions.includes(ext);
    const isValidMime = types.mimetypes.includes(file.mimetype);

    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      const error = new Error(
        `Invalid file type. Allowed types: ${types.extensions.join(', ')}`
      );
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  };
};

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

/**
 * Generate unique filename
 * @param {Object} file - Uploaded file object
 * @returns {string} Unique filename
 */
const generateFilename = (file) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname);
  const safeName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  return `${safeName}-${uniqueSuffix}${ext}`;
};

/**
 * Local storage configuration for pitch decks
 */
const pitchDeckStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'pitchdecks');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file));
  },
});

/**
 * Local storage configuration for resources
 */
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'resources');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file));
  },
});

/**
 * Local storage configuration for avatars
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file));
  },
});

// =============================================================================
// S3 CONFIGURATION (Optional)
// =============================================================================

let s3Upload = null;

// Only configure S3 if credentials are provided
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
  try {
    const aws = require('aws-sdk');
    const multerS3 = require('multer-s3');

    aws.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const s3 = new aws.S3();

    s3Upload = multer({
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: process.env.AWS_S3_ACL || 'public-read',
        metadata: (req, file, cb) => {
          cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
          const folder = file.fieldname === 'avatar' ? 'avatars' : 'pitchdecks';
          const filename = generateFilename(file);
          cb(null, `uploads/${folder}/${filename}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: createFileFilter('all'),
    });

    console.log('✅ S3 upload configured');
  } catch (error) {
    console.warn('⚠️ S3 configuration failed:', error.message);
    console.warn('⚠️ Falling back to local storage');
  }
}

// =============================================================================
// MULTER INSTANCES
// =============================================================================

/**
 * Default upload configuration for pitch decks
 */
const uploadPitchDeck = multer({
  storage: pitchDeckStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: createFileFilter('documents'),
});

/**
 * Upload configuration for resources
 */
const uploadResource = multer({
  storage: resourceStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for resources
    files: 1,
  },
  fileFilter: createFileFilter('all'),
});

/**
 * Upload configuration for avatars
 */
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
    files: 1,
  },
  fileFilter: createFileFilter('images'),
});

// =============================================================================
// ERROR HANDLING WRAPPER
// =============================================================================

/**
 * Wrap multer upload with error handling
 * @param {Object} uploadHandler - Multer upload handler
 * @returns {Function} Express middleware
 */
const handleUpload = (uploadHandler) => {
  return (req, res, next) => {
    uploadHandler(req, res, (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          let message = 'File upload error';

          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'File size too large';
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Too many files';
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = `Unexpected field: ${err.field}`;
              break;
            case 'LIMIT_PART_COUNT':
              message = 'Too many parts';
              break;
            case 'LIMIT_FIELD_KEY':
              message = 'Field name too long';
              break;
            case 'LIMIT_FIELD_VALUE':
              message = 'Field value too long';
              break;
            case 'LIMIT_FIELD_COUNT':
              message = 'Too many fields';
              break;
          }

          return res.status(400).json({
            success: false,
            message,
            code: err.code,
          });
        }

        // Handle custom errors (e.g., invalid file type)
        if (err.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            message: err.message,
            code: 'INVALID_FILE_TYPE',
          });
        }

        // Handle other errors
        console.error('Upload error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error uploading file',
        });
      }

      next();
    });
  };
};

// =============================================================================
// EXPORTS
// =============================================================================

// Use S3 if configured, otherwise use local storage
const upload = s3Upload || uploadPitchDeck;

module.exports = upload;
module.exports.uploadPitchDeck = uploadPitchDeck;
module.exports.uploadResource = uploadResource;
module.exports.uploadAvatar = uploadAvatar;
module.exports.handleUpload = handleUpload;
module.exports.createFileFilter = createFileFilter;
