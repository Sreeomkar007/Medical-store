let selectedProduct = null;

async function api(params) {
  const url = CONFIG.API_URL + '?' + new URLSearchParams(params);
  return (await fetch(url)).json();
}

async function post(body) {
  const res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function loadCompany() {
  const c = await api({ action: 'company' });
  document.getElementById('logo').src = c.logo_url;
  document.getElementById('company-name').textContent = c.name;
  document.getElementById('company-desc').textContent = c.description;
  document.getElementById('contact').innerHTML =
    `${c.email} · ${c.phone}<br>${c.address}<br>${c.support_hours}`;
}

async function loadProducts() {
  const products = await api({ action: 'products' });
  document.getElementById('products').innerHTML = products.map(p => {
    const img = (p.image_urls || '').split(',')[0] || '';
    return `
      <div class="card">
        <img src="${img}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p><strong>₹${p.price}</strong> ${p.stock > 0 ? '' : '(out of stock)'}</p>
        <button ${p.stock > 0 ? '' : 'disabled'} onclick="buy('${p.id}')">Buy now</button>
      </div>`;
  }).join('');
}

function buy(productId) {
  selectedProduct = productId;
  document.getElementById('checkout-form').style.display = 'block';
  document.getElementById('checkout-form').scrollIntoView();
}

document.getElementById('pay-btn').addEventListener('click', async () => {
  const customer = {
    name: document.getElementById('c-name').value,
    email: document.getElementById('c-email').value,
    phone: document.getElementById('c-phone').value,
    address: document.getElementById('c-address').value
  };

  const order = await post({ action: 'createOrder', productId: selectedProduct, qty: 1, customer });
  if (order.error) return alert('Could not start payment: ' + order.error);

  const rzp = new Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: 'INR',
    order_id: order.razorpayOrderId,
    name: document.getElementById('company-name').textContent,
    prefill: { name: customer.name, email: customer.email, contact: customer.phone },
    handler: async (resp) => {
      const v = await post({ action: 'verifyPayment', ...resp });
      alert(v.ok ? 'Payment successful. Thank you!' : 'Verification failed. Please contact us.');
    }
  });
  rzp.open();
});

loadCompany();
loadProducts();