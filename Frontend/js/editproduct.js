// Determine API base URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api' // Local backend for development
  : 'https://joginder.onrender.com/api'; // Deployed backend for production

// Function to show messages
function showMessage(elementId, message, type) {
  const messageDiv = document.getElementById(elementId);
  if (!messageDiv) return;
  messageDiv.textContent = message;
  messageDiv.className = type; // 'success' or 'error'
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
    messageDiv.className = '';
  }, 3000);
}

// Function to fetch product details and populate the form
async function loadProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id'); // This is the MongoDB _id

  if (!productId) {
    showMessage('message', 'Error: No product ID provided', 'error');
    return;
  }

  try {
    // Show loading indicator
    document.getElementById('loading').style.display = 'block';

    // Fetch product details from the backend
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
    }

    const product = await response.json();

    // Populate form fields
    document.getElementById('productId').value = product.id || '';
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productNutrients').value = product.nutrients ? product.nutrients.join(', ') : '';
    document.getElementById('productCalories').value = product.calories || '';
    document.getElementById('productHealthBenefits').value = product.healthBenefits || '';
    document.getElementById('productTags').value = product.tags ? product.tags.join(', ') : '';

    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching product details:', error);
    showMessage('message', `Error: ${error.message}`, 'error');
    document.getElementById('loading').style.display = 'none';
  }
}

// Function to handle form submission and update product
async function updateProduct(event) {
  event.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id'); // MongoDB _id

  if (!productId) {
    showMessage('message', 'Error: No product ID provided', 'error');
    return;
  }

  // Collect form data
  const formData = {
    id: document.getElementById('productId').value,
    name: document.getElementById('productName').value,
    price: document.getElementById('productPrice').value,
    image: document.getElementById('productImage').value,
    category: document.getElementById('productCategory').value,
    description: document.getElementById('productDescription').value,
    nutrients: document.getElementById('productNutrients').value.split(',').map(item => item.trim()).filter(item => item),
    calories: document.getElementById('productCalories').value,
    healthBenefits: document.getElementById('productHealthBenefits').value,
    tags: document.getElementById('productTags').value.split(',').map(item => item.trim()).filter(item => item),
  };

  try {
    // Show loading indicator
    document.getElementById('loading').style.display = 'block';

    // Send update request to the backend
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update product: ${response.status} ${response.statusText}`);
    }

    showMessage('message', 'Product updated successfully!', 'success');
    setTimeout(() => {
      window.location.href = './home.html'; // Redirect to home page after success
    }, 2000);
  } catch (error) {
    console.error('Error updating product:', error);
    showMessage('message', `Error: ${error.message}`, 'error');
  } finally {
    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  loadProductDetails(); // Load product details when the page loads
  document.getElementById('editProductForm').addEventListener('submit', updateProduct); // Attach form submission handler
});
