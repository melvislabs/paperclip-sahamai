import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<LoginFormData | RegisterFormData>(() => ({
    email: '',
    password: '',
    confirmPassword: ''
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      try {
        const response = await fetch('/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorResponse = await response.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(errorResponse.message || 'Login failed');
        }

        const result = await response.json();
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userEmail', data.email);
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      onClose();
      window.location.reload();
    },
    onError: (error) => {
      setErrors([error instanceof Error ? error.message : 'Login failed']);
      setSuccessMessage(null);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      try {
        if (data.password !== data.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const response = await fetch('/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password
          })
        });

        if (!response.ok) {
          const errorResponse = await response.json().catch(() => ({ message: 'Registration failed' }));
          throw new Error(errorResponse.message || 'Registration failed');
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setSuccessMessage('Registration successful! You can now sign in.');
      setErrors([]);
      setTimeout(() => {
        setIsLogin(true);
        setSuccessMessage(null);
      }, 2000);
    },
    onError: (error) => {
      setErrors([error instanceof Error ? error.message : 'Registration failed']);
      setSuccessMessage(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage(null);

    if (isLogin) {
      const loginData = { email: formData.email, password: formData.password };
      loginMutation.mutate(loginData);
    } else {
      const registerData = { 
        email: formData.email, 
        password: formData.password, 
        confirmPassword: (formData as RegisterFormData).confirmPassword 
      };
      registerMutation.mutate(registerData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? 'Sign In' : 'Register'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {errors.map((error, index) => (
              <p key={index} className="text-red-800 text-sm">{error}</p>
            ))}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="•••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={(formData as RegisterFormData).confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="•••••••••"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Sign In'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending || registerMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {(() => {
              if (loginMutation.isPending || registerMutation.isPending) {
                return 'Processing...';
              }
              return isLogin ? 'Sign In' : 'Register';
            })()}
          </button>
        </form>
      </div>
    </div>
  );
}
