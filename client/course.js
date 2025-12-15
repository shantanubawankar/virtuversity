async function api(path, { method = 'GET', body } = {}) {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  }
  let res = await fetch(path, opts);
  let ct = res.headers.get('content-type') || '';
  if (!res.ok && ct.includes('text/html')) {
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

function getParam(name) {
  const parts = window.location.pathname.split('/');
  return parts[2] || new URLSearchParams(window.location.search).get(name);
}

async function loadCourse() {
  const id = getParam('id');
  const boxTitle = document.getElementById('courseTitle');
  const boxDesc = document.getElementById('courseDesc');
  const boxTeacher = document.getElementById('courseTeacher');
  try {
    const { course } = await api(`/api/courses/${id}`);
    boxTitle.textContent = course.title;
    boxDesc.textContent = course.description || '';
    if (course.teacherId) {
      boxTeacher.textContent = `By ${course.teacherId}`;
    }
  } catch (e) {
    boxTitle.textContent = 'Course not found';
    boxDesc.textContent = e.message;
  }
}

async function enroll() {
  const status = document.getElementById('enrollStatus');
  const id = getParam('id');
  try {
    status.textContent = 'Starting checkout...';
    const me = await api('/api/auth/me').catch(() => null);
    if (!me || !me.user) {
      status.textContent = 'Please login first';
      window.showToast && window.showToast('Please login first', 'error');
      return;
    }
    const { key } = await api('/api/payments/key');
    const { order } = await api('/api/payments/create-order', { method: 'POST', body: { amount: 29900, currency: 'INR', receipt: `course_${id}_${Date.now()}` } });
    const options = {
      key,
      amount: order.amount.toString(),
      currency: order.currency,
      name: 'Virtuversity',
      description: `Enrollment: ${id}`,
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
          if (v.verified) {
            status.textContent = 'Payment verified. Sending confirmation...';
            const email = me.user.email;
            await api('/api/emails/enrollment', { method: 'POST', body: { to: email, course: id, teacher: 'Virtuversity' } }).catch(() => {});
            await api('/api/emails/receipt', { method: 'POST', body: { to: email, amount: order.amount / 100, currency: order.currency } }).catch(() => {});
            await api('/api/enrollments', { method: 'POST', body: { courseId: id } }).catch(() => {});
            status.textContent = 'Enrollment confirmed. Check your email.';
            window.showToast && window.showToast('Enrollment confirmed', 'success');
          } else {
            status.textContent = 'Payment verification failed';
            window.showToast && window.showToast('Payment verification failed', 'error');
          }
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
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadCourse();
  document.getElementById('enrollBtn').addEventListener('click', enroll);
});
