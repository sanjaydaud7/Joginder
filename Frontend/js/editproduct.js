const API_BASE_URL = 'https://joginder.onrender.com/api';

// Function to show messages
function showMessage(message, type) {
  const messageDiv = document.getElementById('message');
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
async function fetchProduct(id) {
  try {
    // Show loading indicator
    document.getElementById('loading').style.display = 'block';
    document.getElementById('message').style.display = 'none';

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
    }

    const product = await response.json();
    populateForm(product);

    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching product:', error);
    showMessage(`Error: ${error.message}`, 'error');
    document.getElementById('loading').style.display = 'none';
  }
}

// Function to populate the form with product details
function populateForm(product) {
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
  // Store _id in a hidden input or data attribute for use in update
  document.getElementById('editProductForm').dataset.mongoId = product._id;
}

// Function to handle form submission for updating product
async function updateProduct(event) {
  event.preventDefault();

  const mongoId = document.getElementById('editProductForm').dataset.mongoId;
  if (!mongoId) {
    showMessage('Error: Invalid product ID', 'error');
    return;
  }

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
    document.getElementById('message').style.display = 'none';

    const response = await fetch(`${API_BASE_URL}/products/${mongoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Failed to update product: ${response.status} ${response.statusText}`);
    }

    showMessage('Product updated successfully!', 'success');
    // Redirect to home page after successful update
    setTimeout(() => {
      window.location.href = './home.html';
    }, 2000);

    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('Error updating product:', error);
    showMessage(`Error: ${error.message}`, 'error');
    document.getElementById('loading').style.display = 'none';
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    fetchProduct(productId);
  } else {
    showMessage('Error: No product ID provided', 'error');
    document.getElementById('loading').style.display = 'none';
  }

  // Add event listener for form submission
  document.getElementById('editProductForm').addEventListener('submit', updateProduct);
});