const API_BASE_URL = 'https://joginder.onrender.com/api'; // Backend URL for local development

// Show specific section
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  if (sections.length === 0) return; // Exit if no sections exist
  sections.forEach(section => section.classList.remove('active'));
  const targetSection = document.getElementById(sectionId);
  if (targetSection) targetSection.classList.add('active');
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('sidebar-hidden');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.classList.remove('with-sidebar');
  } else {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('sidebar-hidden');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.classList.add('with-sidebar');
  }

  // Load chart data when analytics section is shown
  if (sectionId === 'analytics') {
    fetchUsersByMonth();
  }
}

// Function to fetch and display products
async function fetchProducts(searchQuery = '') {
  try {
    // Show loading indicator
    document.getElementById('productLoading').style.display = 'block';
    document.getElementById('productMessage').style.display = 'none';

    // Construct the API URL with optional search query
    const url = searchQuery
      ? `${API_BASE_URL}/products?search=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/products`;

    // Fetch products from the backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    displayProducts(products);

    // Update total products count in the dashboard
    document.getElementById('totalProducts').textContent = products.length;

    // Hide loading indicator
    document.getElementById('productLoading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching products:', error);
    showMessage('productMessage', `Error: ${error.message}`, 'error');
    document.getElementById('productLoading').style.display = 'none';
  }
}

// Function to display products in the table
function displayProducts(products) {
  const productTable = document.getElementById('productTable');
  productTable.innerHTML = ''; // Clear existing table content

  if (products.length === 0) {
    productTable.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
    return;
  }

  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.id || 'N/A'}</td>
      <td>${product.name || 'N/A'}</td>
      <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
      <td>${product.category || 'N/A'}</td>
      <td>
        <a href="edit-product.html?id=${product._id}" class="action-btn edit">Edit</a>
        <button class="action-btn delete" onclick="showDeleteConfirm('${product._id}')">Delete</button>
      </td>
    `;
    productTable.appendChild(row);
  });
}

// Delete product with confirmation popup
let productToDelete = null;

function showDeleteConfirm(id) {
  if (!id) {
    showMessage('productMessage', 'Error: Invalid product ID', 'error');
    console.error('Invalid product ID:', id);
    return;
  }
  productToDelete = id;
  const confirmPopup = document.getElementById('confirmDeletePopup');
  const overlay = document.getElementById('popupOverlay');
  if (confirmPopup && overlay) {
    confirmPopup.classList.add('active');
    overlay.classList.add('active');
  }
}

async function confirmDelete() {
  if (!productToDelete) {
    showMessage('productMessage', 'Error: No product selected for deletion', 'error');
    return;
  }

  console.log('Attempting to delete product ID:', productToDelete);
  const confirmPopup = document.getElementById('confirmDeletePopup');
  const overlay = document.getElementById('popupOverlay');
  const deleteButton = document.querySelector(`button[onclick="showDeleteConfirm('${productToDelete}')"]`);
  if (deleteButton) deleteButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productToDelete}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Failed to delete product: ${response.status} ${response.statusText}`);
    }
    showMessage('productMessage', 'Product deleted successfully!', 'success');
    await fetchProducts(); // Refresh product list
  } catch (error) {
    console.error('Error deleting product:', error.message, error.stack);
    showMessage('productMessage', `Error: ${error.message}`, 'error');
  } finally {
    if (confirmPopup && overlay) {
      confirmPopup.classList.remove('active');
      overlay.classList.remove('active');
    }
    if (deleteButton) deleteButton.disabled = false;
    productToDelete = null;
  }
}

function cancelDelete() {
  const confirmPopup = document.getElementById('confirmDeletePopup');
  const overlay = document.getElementById('popupOverlay');
  if (confirmPopup && overlay) {
    confirmPopup.classList.remove('active');
    overlay.classList.remove('active');
  }
  productToDelete = null;
}

function showMessage(elementId, message, type) {
  const messageDiv = document.getElementById(elementId) || document.getElementById('message');
  if (!messageDiv) return; // Exit if messageDiv doesn't exist
  messageDiv.textContent = message;
  messageDiv.className = type; // 'success' or 'error'
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
    messageDiv.className = '';
  }, 3000);
}

// Function to fetch and display users
async function fetchUsers(searchQuery = '') {
  try {
    // Show loading indicator
    document.getElementById('userLoading').style.display = 'block';
    document.getElementById('userMessage').style.display = 'none';

    // Construct the API URL with optional search query
    const url = searchQuery
      ? `${API_BASE_URL}/users?search=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/users`;

    // Fetch users from the backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }

    const users = await response.json();
    displayUsers(users);

    // Update total users count in the dashboard
    document.getElementById('totalUsers').textContent = users.length;

    // Hide loading indicator
    document.getElementById('userLoading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching users:', error);
    showMessage('userMessage', `Error: ${error.message}`, 'error');
    document.getElementById('userLoading').style.display = 'none';
  }
}

// Function to display users in the table
function displayUsers(users) {
  const userTable = document.getElementById('userTable');
  userTable.innerHTML = ''; // Clear existing table content

  if (users.length === 0) {
    userTable.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
    return;
  }

  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.fName || 'N/A'}</td>
      <td>${user.lName || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.phone || 'N/A'}</td>
    `;
    userTable.appendChild(row);
  });
}

// Function to fetch user counts by month
async function fetchUsersByMonth() {
  try {
    // Show loading indicator
    document.getElementById('analyticsLoading').style.display = 'block';
    document.getElementById('analyticsMessage').style.display = 'none';

    const response = await fetch(`${API_BASE_URL}/users/by-month`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    renderUsersByMonthChart(data);

    // Hide loading indicator
    document.getElementById('analyticsLoading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching users by month:', error);
    showMessage('analyticsMessage', `Error: ${error.message}`, 'error');
    document.getElementById('analyticsLoading').style.display = 'none';
  }
}

// Function to render the users by month chart
function renderUsersByMonthChart(data) {
  const ctx = document.getElementById('usersByMonthChart').getContext('2d');

  // Destroy existing chart if it exists to prevent overlap
  if (window.usersByMonthChart instanceof Chart) {
    window.usersByMonthChart.destroy();
  }

  // Prepare data for the chart
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const counts = new Array(12).fill(0); // Initialize counts for all months

  data.forEach(item => {
    const monthIndex = months.indexOf(item.month.split(' ')[0]); // Extract month name
    if (monthIndex !== -1) {
      counts[monthIndex] = item.count;
    }
  });

  window.usersByMonthChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Users Registered',
        data: counts,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Users',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Month (2025)',
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: 'Users by Month (2025)',
        },
      },
    },
  });
}

// Placeholder functions for sorting and CSV download
function sortUsers(order) {
  console.log(`Sorting users in ${order} order`);
  // Implement sorting logic if needed
}

function downloadUsersCSV() {
  console.log('Downloading users CSV');
  // Implement CSV download logic if needed
}

// Event listeners
document.getElementById('productSearch').addEventListener('input', (e) => {
  const searchQuery = e.target.value.trim();
  fetchProducts(searchQuery);
});

document.getElementById('userSearch').addEventListener('input', (e) => {
  const searchQuery = e.target.value.trim();
  fetchUsers(searchQuery);
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts(); // Fetch products when the page loads
  fetchUsers(); // Fetch users when the page loads
  showSection('dashboard'); // Show dashboard by default
});