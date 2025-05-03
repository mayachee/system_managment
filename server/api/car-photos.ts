import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import * as carFeaturesAPI from './car-features';
import { fileURLToPath } from 'url';

// Ensure the upload directory exists
const publicDir = path.join(process.cwd(), 'public');
const uploadsDir = path.join(publicDir, 'uploads', 'cars');

// Create directories if they don't exist
try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating upload directories:', error);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const carId = req.params.id;
    const carDir = path.join(uploadsDir, carId);
    
    // Create car-specific directory if it doesn't exist
    if (!fs.existsSync(carDir)) {
      fs.mkdirSync(carDir, { recursive: true });
    }
    
    cb(null, carDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'photo-' + uniqueSuffix + extension);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter
});

/**
 * Upload photos for a car
 */
export async function uploadCarPhotos(req: Request, res: Response) {
  try {
    const carId = parseInt(req.params.id);
    if (isNaN(carId)) {
      return res.status(400).json({ error: 'Invalid car ID' });
    }
    
    // Get uploaded files
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Get category information
    let categories = req.body.categories;
    if (!categories) {
      categories = [];
    } else if (!Array.isArray(categories)) {
      categories = [categories];
    }
    
    // Ensure we have category info for each file
    while (categories.length < files.length) {
      categories.push('extra'); // Default category
    }
    
    // Get or create car features
    const features = await carFeaturesAPI.getOrCreateCarFeatures(carId);
    
    // Initialize structure for categorized images
    let existingImagesByCategory: Record<string, string[]> = {
      main: [],
      interior: [],
      exterior: [],
      damage: [],
      other: []
    };
    
    // Process existing images
    if (features.additionalImages) {
      let parsedImages: any = features.additionalImages;
      
      // If it's a string (from jsonb), parse it
      if (typeof features.additionalImages === 'string') {
        try {
          parsedImages = JSON.parse(features.additionalImages);
        } catch (error) {
          console.warn('Error parsing additionalImages JSON:', error);
          parsedImages = [];
        }
      }
      
      // Handle both array format (old) and object format (new)
      if (Array.isArray(parsedImages)) {
        // Old format - flat array, put in 'other' category
        existingImagesByCategory.other = parsedImages;
      } else if (typeof parsedImages === 'object') {
        // New format - categorized object
        existingImagesByCategory = {
          main: Array.isArray(parsedImages.main) ? parsedImages.main : 
               (Array.isArray(parsedImages.side) ? parsedImages.side : []),
          interior: Array.isArray(parsedImages.interior) ? parsedImages.interior : [],
          exterior: Array.isArray(parsedImages.exterior) ? parsedImages.exterior : 
                  (Array.isArray(parsedImages.back) ? parsedImages.back : []),
          damage: Array.isArray(parsedImages.damage) ? parsedImages.damage : [],
          other: Array.isArray(parsedImages.other) ? parsedImages.other : 
               (Array.isArray(parsedImages.extra) ? parsedImages.extra : [])
        };
      }
    }
    
    // Generate URLs for the uploaded files and organize by category
    const uploadedUrls: string[] = [];
    files.forEach((file, index) => {
      // Create a URL relative to the server root
      const url = `/public/uploads/cars/${carId}/${file.filename}`;
      uploadedUrls.push(url);
      
      // Add to appropriate category
      const category = categories[index] || 'other';
      if (['main', 'interior', 'exterior', 'damage', 'other'].includes(category)) {
        existingImagesByCategory[category].push(url);
      } else {
        existingImagesByCategory.other.push(url);
      }
    });
    
    // Update car features with new categorized image structure
    const updatedFeatures = await carFeaturesAPI.updateCarFeatures(carId, {
      additionalImages: existingImagesByCategory
    });
    
    res.status(200).json({
      message: 'Photos uploaded successfully',
      uploadedFiles: uploadedUrls,
      features: updatedFeatures
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
}

/**
 * Delete a photo from a car
 */
export async function deleteCarPhoto(req: Request, res: Response) {
  try {
    const carId = parseInt(req.params.id);
    if (isNaN(carId)) {
      return res.status(400).json({ error: 'Invalid car ID' });
    }
    
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }
    
    // Get car features
    const features = await carFeaturesAPI.getCarFeatures(carId);
    if (!features) {
      return res.status(404).json({ error: 'Car features not found' });
    }
    
    // Initialize structure for categorized images
    let existingImagesByCategory: Record<string, string[]> = {
      main: [],
      interior: [],
      exterior: [],
      damage: [],
      other: []
    };
    
    // Keep track of whether we found the image to delete
    let foundImage = false;
    let categoryWithImage: string | null = null;
    
    // Process existing images
    if (features.additionalImages) {
      let parsedImages: any = features.additionalImages;
      
      // If it's a string (from jsonb), parse it
      if (typeof features.additionalImages === 'string') {
        try {
          parsedImages = JSON.parse(features.additionalImages);
        } catch (error) {
          console.warn('Error parsing additionalImages JSON:', error);
          parsedImages = [];
        }
      }
      
      // Handle both array format (old) and object format (new)
      if (Array.isArray(parsedImages)) {
        // Old format - flat array, put in 'other' category
        existingImagesByCategory.other = parsedImages;
        // Check if the photo is in the array
        if (parsedImages.includes(photoUrl)) {
          foundImage = true;
          categoryWithImage = 'other';
        }
      } else if (typeof parsedImages === 'object') {
        // New format - categorized object
        existingImagesByCategory = {
          main: Array.isArray(parsedImages.main) ? parsedImages.main : 
               (Array.isArray(parsedImages.side) ? parsedImages.side : []),
          interior: Array.isArray(parsedImages.interior) ? parsedImages.interior : [],
          exterior: Array.isArray(parsedImages.exterior) ? parsedImages.exterior : 
                  (Array.isArray(parsedImages.back) ? parsedImages.back : []),
          damage: Array.isArray(parsedImages.damage) ? parsedImages.damage : [],
          other: Array.isArray(parsedImages.other) ? parsedImages.other : 
               (Array.isArray(parsedImages.extra) ? parsedImages.extra : [])
        };
        
        // Check if the photo exists in any category
        for (const category of ['main', 'interior', 'exterior', 'damage', 'other']) {
          if (existingImagesByCategory[category].includes(photoUrl)) {
            foundImage = true;
            categoryWithImage = category;
            break;
          }
        }
      }
    }
    
    // Check if the photo URL exists in any category
    if (!foundImage) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Try to delete the file from disk
    try {
      // Parse the URL to get the filename
      const urlPath = new URL(photoUrl, 'http://localhost').pathname;
      const filePath = path.join(process.cwd(), urlPath.replace(/^\/public/, ''));
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Error deleting file from disk:', error);
      // Continue even if file deletion fails - we'll still update the database
    }
    
    // Remove the URL from the category
    if (categoryWithImage) {
      existingImagesByCategory[categoryWithImage] = 
        existingImagesByCategory[categoryWithImage].filter(url => url !== photoUrl);
    }
    
    // Update car features
    const updatedFeatures = await carFeaturesAPI.updateCarFeatures(carId, {
      additionalImages: existingImagesByCategory
    });
    
    res.status(200).json({
      message: 'Photo deleted successfully',
      features: updatedFeatures
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
}