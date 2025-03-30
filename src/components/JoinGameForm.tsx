'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function JoinGameForm() {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join game');
      }

      router.push(`/game/${formData.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Join Game</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Game Code
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter 6-character code"
              required
              minLength={6}
              maxLength={6}
              pattern="[A-Za-z0-9]{6}"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your name"
              required
              minLength={2}
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining Game...
              </>
            ) : (
              'Join Game'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}