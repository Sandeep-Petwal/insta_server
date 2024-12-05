const multer = require('multer');
const path = require('path');


//  multer for file storage :: setup
exports.storage = multer.diskStorage({
    //upload directory
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    // unique filename by  timestamp
    filename: (req, file, cb) => {
        cb(null, "instabook_" + Date.now() + path.extname(file.originalname));
    },
});

// multer for file storage (support)
exports.storage_support = multer.diskStorage({
    //upload directory
    destination: (req, file, cb) => {
        cb(null, 'uploads/support/');
    },

    // unique filename by  timestamp
    filename: (req, file, cb) => {
        cb(null, "support_" + Date.now() + path.extname(file.originalname));
    },
});


exports.imageFileFilter = (req, file, cb) => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (validImageTypes.includes(file.mimetype)) {
        cb(null, true); // accept file
    } else {
        cb(new Error('Not an image! Please upload an image file.'), false); // reject file
    }
};
