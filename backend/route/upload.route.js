import express from 'express';
import createUploader from '../upload/upload.js'; 
const router = express.Router();

router.post('/upload/uploads/profile-image', createUploader('profile', 'single', 'image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  return res.status(200).json({
    success: true,
    filename: req.file.filename,
    path: `/profile-images/${req.file.filename}` 
  });
});

const uploadRouter = router;
export default uploadRouter;
