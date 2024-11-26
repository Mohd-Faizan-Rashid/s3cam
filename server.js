const express = require('express');
const { S3 } = require('@aws-sdk/client-s3');
const multer = require('multer');
require('dotenv').config();
const path = require('path'); // Import path module

const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname))); // Serve files in the current directory

// AWS S3 Configuration
const s3 = new S3({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer configuration to handle file uploads
const storage = multer.memoryStorage(); // Store image in memory buffer
const upload = multer({ storage: storage });

// Upload photo to S3
const uploadToS3 = async (fileBuffer, fileName) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME, // Replace with your bucket name
        Key: fileName, // File name you want to save as in S3
        Body: fileBuffer,
        ContentType: 'image/png' // MIME type for PNG
    };

    return await s3.putObject(params); // Use putObject instead of upload
};

// Route to handle file upload
app.post('/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileBuffer = req.file.buffer; // Get file buffer from multer
        const fileName = `${Date.now()}_${req.file.originalname}`; // Unique file name

        // Upload the image to S3
        await uploadToS3(fileBuffer, fileName);
        console.log(`File uploaded successfully: ${fileName}`); // Log success message

        res.json({ message: 'Photo uploaded successfully!', fileName: fileName });
    } catch (error) {
        console.error('Error uploading photo:', error); // Log the error
        res.status(500).json({ message: 'Failed to upload photo', error });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
