'use client';
import { useState } from 'react';

export default function RatePage({ params }: { params: { slug: string; tableCode: string } }) {
  const [submitting, setSubmitting] = useState(false);
  const emojis = [
    { v: 1, label: '\uD83D\uDE22', color: '#EF4444' },
    { v: 2, label: '\u2639\uFE0F', color: '#F97316' },
    { v: 3, label: '\uD83D\uDE10', color: '#EAB308' },
    { v: 4, label: '\uD83D\uDE42', color: '#22C55E' },
    { v: 5, label: '\uD83D\uDE01', color: '#16A34A' },
  ];
  const submit = async (rating: number) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: params.slug,
          tableCode: params.tableCode,
          rating,
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
      const data = await res.json();
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        alert('Thanks for your feedback!');
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main
      style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', gap: '24px', padding: '24px' }}
    >
      <h1 style={{ fontSize: '22px', fontWeight: 700 }}>How was your experience?</h1>
      <div style={{ display: 'flex', gap: '16px' }}>
        {emojis.map((e) => (
          <button
            key={e.v}
            onClick={() => submit(e.v)}
            disabled={submitting}
            aria-label={`Rate ${e.v}`}
            style={{
              fontSize: '42px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: e.color,
            }}
          >
            {e.label}
          </button>
        ))}
      </div>
      <p style={{ opacity: 0.6, fontSize: '13px' }}>Red → Green = Sad → Happy</p>
    </main>
  );
}
