import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RegisterForm = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role_id: ''
  });

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/roles')
      .then(res => setRoles(res.data))
      .catch(err => toast.error('Помилка отримання ролей'));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!isValidEmail(form.username)) {
      toast.error('Введіть дійсну електронну адресу');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    const payload = {
      username: form.username,
      password: form.password,
      role_id: form.role_id
    };

    axios.post('http://localhost:5000/register', payload)
      .then(res => toast.success(res.data.message))
      .catch(err => {
        const error = err.response?.data?.error || 'Помилка при реєстрації';
        toast.error(error);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        placeholder="Email"
        value={form.username}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Пароль"
        value={form.password}
        onChange={handleChange}
        required
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Підтвердження паролю"
        value={form.confirmPassword}
        onChange={handleChange}
        required
      />
      <select
        name="role_id"
        value={form.role_id}
        onChange={handleChange}
        required
      >
        <option value="">Оберіть роль</option>
        {roles.map(r => (
          <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
        ))}
      </select>
      <button type="submit">Зареєструватися</button>
    </form>
  );
};

export default RegisterForm;
