// Gold Geek User Dashboard - Authentication

function checkAuth() {
  const token = sessionStorage.getItem('authToken');
  const userId = sessionStorage.getItem('userId');

  if (!token || !userId) {
    window.location.href = 'login.html';
    return null;
  }

  return {
    token,
    userId,
    name: sessionStorage.getItem('userName'),
    email: sessionStorage.getItem('userEmail')
  };
}

function handleLogin(email) {
  sessionStorage.setItem('pendingEmail', email);
  window.location.href = 'check-email.html';
}

function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const email = params.get('email');

  if (token && email) {
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    if (customer) {
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('userId', customer.id);
      sessionStorage.setItem('userName', customer.name);
      sessionStorage.setItem('userEmail', customer.email);
    } else {
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('userId', 'c1');
      sessionStorage.setItem('userName', 'John Doe');
      sessionStorage.setItem('userEmail', email);
    }

    window.location.href = 'index.html';
  } else {
    window.location.href = 'login.html';
  }
}

function logout() {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('userEmail');
  sessionStorage.removeItem('pendingEmail');
  window.location.href = 'login.html';
}

function getCurrentUser() {
  return {
    id: sessionStorage.getItem('userId'),
    name: sessionStorage.getItem('userName'),
    email: sessionStorage.getItem('userEmail')
  };
}
