import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-40 -mr-40 w-[600px] h-[600px] bg-zinc-200/50 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 -mb-40 -ml-40 w-[600px] h-[600px] bg-zinc-200/50 blur-[120px] rounded-full"></div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-zinc-100">
        <div className="bg-zinc-50 p-14 text-center border-b border-zinc-100">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-6 transition-transform hover:rotate-0 duration-500">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter uppercase">Rite <span className="text-zinc-400">Electricals</span></h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Enterprise Billing Systems</p>
        </div>

        <div className="p-12">
          <h3 className="text-[10px] font-black text-zinc-400 mb-10 text-center uppercase tracking-[0.3em]">Authorized Personnel Gateway</h3>

          {error && (
            <div className="bg-zinc-900 text-white p-4 rounded-xl text-[10px] font-black mb-10 border border-zinc-800 text-center uppercase tracking-widest animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-14 input-field py-4 bg-zinc-50 border-zinc-100 focus:ring-2 focus:ring-black focus:bg-white transition-all font-black tracking-widest text-[10px]"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 pr-12 input-field py-4 bg-zinc-50 border-zinc-100 focus:ring-2 focus:ring-black focus:bg-white transition-all font-black"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-300 hover:text-zinc-900 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 mt-10 shadow-2xl active:scale-95 transition-all"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
