const fs = require('fs');
const path = require('path');

// Read the new menu data from the API response
const newMenuData = JSON.parse(fs.readFileSync('new_menu_data.json', 'utf8'));

// Read the current menu.js file
const menuFilePath = path.join(__dirname, 'menu.js');
const currentMenuContent = fs.readFileSync(menuFilePath, 'utf8');

// Create the new content with proper formatting
const newMenuContent = `const data = ${JSON.stringify(newMenuData, null, 4)};`;

// Check if the content is actually different
if (currentMenuContent.trim() !== newMenuContent.trim()) {
    // Write the updated content to menu.js
    fs.writeFileSync(menuFilePath, newMenuContent);
    console.log('menu.js has been updated successfully');
} else {
    console.log('No changes detected in menu data');
}