const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://joginder.onrender.com/api';

let currentUsers = [];
let currentOrders = [];
let currentOrderIdForStatusUpdate = null;
let selectedStatus = null;

function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  if (sections.length === 0) return;
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

  if (sectionId === 'analytics') {
    fetchUsersByMonth();
  } else if (sectionId === 'orders') {
    fetchOrders();
  }
}

async function fetchOrders(searchQuery = '') {
  try {
    const ordersSection = document.getElementById('orders');
    if (!ordersSection) return;
    
    ordersSection.querySelector('.card').innerHTML = '<p>Loading orders...</p>';

    const url = searchQuery
      ? `${API_BASE_URL}/orders?search=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/orders`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }

    currentOrders = await response.json();
    displayOrders(currentOrders);
    document.getElementById('totalOrders').textContent = currentOrders.length;
  } catch (error) {
    console.error('Error fetching orders:', error);
    const ordersSection = document.getElementById('orders');
    if (ordersSection) {
      ordersSection.querySelector('.card').innerHTML = 
        `<p>Error loading orders: ${error.message}</p>`;
    }
  }
}

function displayOrders(orders) {
  const ordersSection = document.getElementById('orders');
  if (!ordersSection) return;

  if (orders.length === 0) {
    ordersSection.querySelector('.card').innerHTML = '<p>No orders found.</p>';
    return;
  }

  let html = `
    <div class="order-actions">
      <input type="text" id="orderSearch" placeholder="Search by status..." class="search-box">
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>User</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total Price</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach(order => {
    // Get user's full name - first try from user object, then from address
    const userName = order.user ? `${order.user.fName || ''} ${order.user.lName || ''}`.trim() : 
                     (order.address ? order.address.fullName : 'N/A');
    
    html += `
      <tr>
        <td>${order._id || 'N/A'}</td>
        <td>${userName}</td>
        <td>${order.product?.name || 'N/A'}</td>
        <td>${order.quantity || 'N/A'}</td>
        <td>$${(order.totalPrice || 0).toFixed(2)}</td>
        <td class="status-${order.status || 'pending'}">${order.status || 'pending'}</td>
        <td>${new Date(order.createdAt).toLocaleDateString() || 'N/A'}</td>
        <td>
          <button class="action-btn edit" onclick="editOrderStatus('${order._id}')">Edit Status</button>
          <button class="action-btn print" onclick="printBillSlip('${order._id}')">Print</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  ordersSection.querySelector('.card').innerHTML = html;

  const orderSearch = document.getElementById('orderSearch');
  if (orderSearch) {
    orderSearch.addEventListener('input', (e) => {
      const searchQuery = e.target.value.trim();
      fetchOrders(searchQuery);
    });
  }
}
function filterOrdersByStatus() {
  const status = document.getElementById('orderStatusFilter').value;
  if (!status) {
    displayOrders(currentOrders); // Show all if no filter
  } else {
    const filtered = currentOrders.filter(order => (order.status || 'pending').toLowerCase() === status);
    displayOrders(filtered);
  }
}
function printBillSlip(orderId) {
  const order = currentOrders.find(o => o._id === orderId);
  if (!order) {
    showMessage('productMessage', 'Order not found', 'error');
    return;
  }

  // Prefer address phone, then user phone, then N/A
  const phone = order.address?.phone || order.user?.phone || 'N/A';
  const userName = order.user ? `${order.user.fName || ''} ${order.user.lName || ''}`.trim() : 
                   (order.address ? order.address.fullName : 'N/A');

  const billSlipContent = `
    <html>
      <head>
        <title>Bill Slip - Order ${order._id}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          .bill-slip { max-width: 300px; border: 1px solid #000; padding: 10px; }
          h2 { font-size: 16px; text-align: center; margin-bottom: 10px; }
          .label { font-weight: bold; }
          .section { margin-bottom: 10px; }
          .section div { margin: 5px 0; }
          hr { border: 0; border-top: 1px solid #ccc; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="bill-slip">
          <h2>Order Bill Slip</h2>
          <div class="section">
            <div><span class="label">Order ID:</span> ${order._id}</div>
            <div><span class="label">Customer:</span> ${userName}</div>
            <div><span class="label">Phone:</span> ${phone}</div>
          </div>
          <div class="section">
            <div><span class="label">Address:</span></div>
            <div>${order.address?.addressLine1 || ''}</div>
            ${order.address?.addressLine2 ? `<div>${order.address.addressLine2}</div>` : ''}
            <div>${order.address?.city || ''}, ${order.address?.state || ''} ${order.address?.zipCode || ''}</div>
            <div>${order.address?.country || ''}</div>
          </div>
          <hr>
          <div class="section">
            <div><span class="label">Product:</span> ${order.product.name}</div>
            <div><span class="label">Quantity:</span> ${order.quantity}</div>
            <div><span class="label">Total Price:</span> $${order.totalPrice.toFixed(2)}</div>
          </div>
        </div>
        <script>
          window.onload = () => window.print();
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(billSlipContent);
  printWindow.document.close();
}

function editOrderStatus(orderId) {
  if (!orderId) {
    showMessage('productMessage', 'Invalid order ID', 'error');
    return;
  }

  currentOrderIdForStatusUpdate = orderId;
  selectedStatus = null;
  
  document.querySelectorAll('.status-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  document.getElementById('statusUpdatePopup').classList.add('active');
  document.getElementById('popupOverlay').classList.add('active');
}

function selectStatus(status) {
  selectedStatus = status;
  
  document.querySelectorAll('.status-option').forEach(option => {
    option.classList.remove('selected');
  });
  document.querySelector(`.status-option.${status}`).classList.add('selected');
}

function cancelStatusUpdate() {
  document.getElementById('statusUpdatePopup').classList.remove('active');
  document.getElementById('popupOverlay').classList.remove('active');
  currentOrderIdForStatusUpdate = null;
  selectedStatus = null;
}

async function updateOrderStatus() {
  if (!currentOrderIdForStatusUpdate || !selectedStatus) {
    showMessage('productMessage', 'Please select a status', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders/${currentOrderIdForStatusUpdate}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: selectedStatus }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      showMessage('productMessage', 'Order status updated successfully!', 'success');
      fetchOrders();
    } else {
      throw new Error(result.message || 'Failed to update order status');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    showMessage('productMessage', `Error: ${error.message}`, 'error');
  } finally {
    cancelStatusUpdate();
  }
}

async function fetchProducts(searchQuery = '') {
  try {
    document.getElementById('productLoading').style.display = 'block';
    document.getElementById('productMessage').style.display = 'none';

    const url = searchQuery
      ? `${API_BASE_URL}/products?search=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/products`;

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
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('productLoading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching products:', error);
    showMessage('productMessage', `Error: ${error.message}`, 'error');
    document.getElementById('productLoading').style.display = 'none';
  }
}

function displayProducts(products) {
  const productTable = document.getElementById('productTable');
  productTable.innerHTML = '';

  if (products.length === 0) {
    productTable.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
    return;
  }

  products.forEach(product => {
    const row = document.createElement('tr');
    const priceValue = product.price && !isNaN(parseFloat(product.price)) 
      ? `$${parseFloat(product.price).toFixed(2)}` 
      : 'N/A';
    row.innerHTML = `
      <td>${product.id || 'N/A'}</td>
      <td>${product.name || 'N/A'}</td>
      <td>${product.price}</td>
      <td>${product.category || 'N/A'}</td>
      <td>
        <a href="edit-product.html?id=${product._id}" class="action-btn edit">Edit</a>
        <button class="action-btn delete" onclick="showDeleteConfirm('${product._id}')">Delete</button>
      </td>
    `;
    productTable.appendChild(row);
  });
}

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
    await fetchProducts();
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
  if (!messageDiv) return;
  messageDiv.textContent = message;
  messageDiv.className = type;
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
    messageDiv.className = '';
  }, 3000);
}

async function fetchUsers(searchQuery = '') {
  try {
    document.getElementById('userLoading').style.display = 'block';
    document.getElementById('userMessage').style.display = 'none';

    const url = searchQuery
      ? `${API_BASE_URL}/users?search=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/users`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }

    currentUsers = await response.json();
    displayUsers(currentUsers);
    document.getElementById('totalUsers').textContent = currentUsers.length;
    document.getElementById('userLoading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching users:', error);
    showMessage('userMessage', `Error: ${error.message}`, 'error');
    document.getElementById('userLoading').style.display = 'none';
  }
}

function displayUsers(users) {
  const userTable = document.getElementById('userTable');
  userTable.innerHTML = '';

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

function sortUsers(order) {
  if (!currentUsers || currentUsers.length === 0) {
    showMessage('userMessage', 'No users available to sort', 'error');
    return;
  }

  const sortedUsers = [...currentUsers];

  sortedUsers.sort((a, b) => {
    const nameA = (a.fName || '').toLowerCase();
    const nameB = (b.fName || '').toLowerCase();
    if (order === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });

  displayUsers(sortedUsers);
  showMessage('userMessage', `Users sorted ${order === 'asc' ? 'A to Z' : 'Z to A'}`, 'success');
}

function downloadUsersCSV() {
  if (!currentUsers || currentUsers.length === 0) {
    showMessage('userMessage', 'No users available to download', 'error');
    return;
  }

  const headers = ['First Name', 'Last Name', 'Email', 'Phone'];
  
  const csvRows = [
    headers.join(','),
    ...currentUsers.map(user => [
      `"${user.fName || 'N/A'}"`,
      `"${user.lName || 'N/A'}"`,
      `"${user.email || 'N/A'}"`,
      `"${user.phone || 'N/A'}"`
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'users_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showMessage('userMessage', 'Users CSV downloaded successfully!', 'success');
}

async function fetchUsersByMonth() {
  try {
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
    document.getElementById('analyticsLoading').style.display = 'none';
  } catch (error) {
    console.error('Error fetching users by month:', error);
    showMessage('analyticsMessage', `Error: ${error.message}`, 'error');
    document.getElementById('analyticsLoading').style.display = 'none';
  }
}

function renderUsersByMonthChart(data) {
  const ctx = document.getElementById('usersByMonthChart').getContext('2d');

  if (window.usersByMonthChart instanceof Chart) {
    window.usersByMonthChart.destroy();
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const counts = new Array(12).fill(0);

  data.forEach(item => {
    const monthIndex = months.indexOf(item.month.split(' ')[0]);
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

document.getElementById('productSearch').addEventListener('input', (e) => {
  const searchQuery = e.target.value.trim();
  fetchProducts(searchQuery);
});

document.getElementById('userSearch').addEventListener('input', (e) => {
  const searchQuery = e.target.value.trim();
  fetchUsers(searchQuery);
});

document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  fetchUsers();
  fetchOrders();
  showSection('dashboard');
});