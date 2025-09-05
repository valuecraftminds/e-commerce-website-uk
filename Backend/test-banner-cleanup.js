// Test script to verify image deletion functionality
// Run this with: node test-banner-cleanup.js

const fs = require('fs');
const path = require('path');

// Simulate the banner deletion functionality
class BannerTestUtils {
  static deleteImageFile(filename, operation = 'delete') {
    if (!filename) {
      console.log('❌ No filename provided');
      return false;
    }
    
    const imagePath = path.join(__dirname, 'uploads/banners', filename);
    console.log(`🔍 Checking file: ${imagePath}`);
    
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`✅ Banner image ${operation}d: ${filename}`);
        return true;
      } else {
        console.log(`⚠️ Banner image not found during ${operation}: ${filename}`);
        return false;
      }
    } catch (deleteErr) {
      console.error(`❌ Error ${operation}ing banner image: ${filename}`, deleteErr.message);
      return false;
    }
  }

  static createTestFile(filename) {
    const uploadDir = path.join(__dirname, 'uploads/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, 'test banner content');
    console.log(`📁 Test file created: ${filename}`);
    return filePath;
  }
}

// Test scenarios
console.log('🧪 Testing Banner Image Deletion Functionality\n');

// Test 1: Delete existing file
console.log('📝 Test 1: Delete existing file');
const testFile1 = 'test-banner-1.jpg';
BannerTestUtils.createTestFile(testFile1);
BannerTestUtils.deleteImageFile(testFile1, 'delet');
console.log('');

// Test 2: Try to delete non-existent file
console.log('📝 Test 2: Delete non-existent file');
BannerTestUtils.deleteImageFile('non-existent-banner.jpg', 'delet');
console.log('');

// Test 3: Replace scenario (delete old, keep new)
console.log('📝 Test 3: Replace scenario');
const oldFile = 'old-banner.jpg';
const newFile = 'new-banner.jpg';
BannerTestUtils.createTestFile(oldFile);
BannerTestUtils.createTestFile(newFile);
console.log('Replacing old file with new file...');
BannerTestUtils.deleteImageFile(oldFile, 'replac');
console.log('New file should still exist:', fs.existsSync(path.join(__dirname, 'uploads/banners', newFile)));
// Cleanup
BannerTestUtils.deleteImageFile(newFile, 'cleanup');
console.log('');

// Test 4: Cleanup scenario
console.log('📝 Test 4: Cleanup failed upload');
const failedFile = 'failed-upload.jpg';
BannerTestUtils.createTestFile(failedFile);
BannerTestUtils.deleteImageFile(failedFile, 'cleanup');
console.log('');

console.log('✅ All tests completed!');

// Cleanup test directory
const testDir = path.join(__dirname, 'uploads');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('🧹 Test directory cleaned up');
}
