async function api(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    headers: Object.assign({}, body ? { 'Content-Type': 'application/json' } : {}, headers || (localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})),
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  }
  let res
  try {
    res = await fetch(path, opts);
  } catch (e) {
    res = await fetch(`https://virtuversity.onrender.com${path}`, opts).catch(() => { throw new Error('Network error') })
  }
  let ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (txt.includes('NOT_FOUND')) {
      res = await fetch(`https://virtuversity.onrender.com${path}`, opts);
      ct = res.headers.get('content-type') || '';
    } else {
      throw new Error(txt || 'Request failed');
    }
  }
  if (!res.ok) {
    let errText = 'Request failed';
    try {
      if (ct.includes('application/json')) {
        const j = await res.json();
        errText = j.error || JSON.stringify(j);
      } else {
        errText = await res.text();
      }
    } catch {}
    throw new Error(errText);
  }
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

function bindPayments() {
  const btn = document.getElementById('checkoutBtn');
  const status = document.getElementById('payStatus');
  btn.addEventListener('click', async () => {
    try {
      status.textContent = 'Starting...';
      const { key } = await api('/api/payments/key');
      const { order } = await api('/api/payments/create-order', { method: 'POST', body: { amount: 50000, currency: 'INR' } });
      const options = {
        key,
        amount: order.amount.toString(),
        currency: order.currency,
        name: 'Virtuversity',
        description: 'Sample purchase',
        order_id: order.id,
        handler: async function (response) {
          try {
            const v = await api('/api/payments/verify', {
              method: 'POST',
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });
            status.textContent = v.verified ? 'Payment verified' : 'Payment verification failed';
            window.showToast && window.showToast(v.verified ? 'Payment verified' : 'Payment verification failed', v.verified ? 'success' : 'error');
          } catch (err) {
            status.textContent = err.message;
            window.showToast && window.showToast(err.message, 'error');
          }
        },
        theme: { color: '#7c3aed' }
      };
      if (typeof window.Razorpay !== 'function') {
        status.textContent = 'Razorpay SDK not loaded';
        window.showToast && window.showToast('Razorpay SDK not loaded', 'error');
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      status.textContent = err.message;
      window.showToast && window.showToast(err.message, 'error');
    }
  });
}

window.addEventListener('DOMContentLoaded', bindPayments);
