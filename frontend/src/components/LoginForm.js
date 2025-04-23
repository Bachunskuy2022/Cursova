import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post('http://localhost:5000/login', form)
      .then(res => {
        toast.success(res.data.message);
        const role = res.data.role_name;

        // Зберігаємо роль у localStorage
        localStorage.setItem('role', role);

        // Редірект на відповідну сторінку
        switch (role) {
          case 'менеджер':
            navigate('/dashboard/manager');
            break;
          case 'водій':
            navigate('/dashboard/driver');
            break;
          case 'страховик':
            navigate('/dashboard/insurer');
            break;
          default:
            toast.error('Невідома роль');
        }
      })
      .catch(err => {
        const error = err.response?.data?.error || 'Помилка входу';
        toast.error(error);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        placeholder="Логін"
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
      <button type="submit">Увійти</button>
    </form>
  );
};

export default LoginForm;
