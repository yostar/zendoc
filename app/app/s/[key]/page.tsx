'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const POLL_INTERVAL_MS = 30000;

export default function SharePage({ params }: { params: { key: string } }) {
  const key = params.key;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!key) return;
    const fetchContent = async (showPolling = false) => {
      if (showPolling) setPolling(true);
      try {
        const res = await fetch(`/api/shares/${key}/content`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Share not found');
          } else {
            setError('Failed to load content');
          }
          return;
        }
        const text = await res.text();
        setContent(text);
        setError(null);
        setLastUpdated(new Date());
      } catch {
        setError('Failed to load content');
      } finally {
        setLoading(false);
        setPolling(false);
      }
    };
    fetchContent();
    const interval = setInterval(() => fetchContent(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [key]);

  if (loading && !content) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 text-sm text-gray-500">
        <span>
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
        </span>
        {polling && <span>Updating...</span>}
      </div>
      <article className="prose prose-gray max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
