'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const user = useUser();
  const router = useRouter();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test API call
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setApiResponse(data);
        setLoading(false);
      })
      .catch((err) => {
        setApiResponse({ error: err.message });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg mb-2">Stack Auth User:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-2">API Response:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>

          <div className="space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/handler/sign-in')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

