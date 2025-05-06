'use client';

import { useState, useMemo } from 'react';

type Line = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
};

export default function Home() {
  const [lines, setLines] = useState<Line[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/parse-dxf', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error('Upload failed');
      return;
    }

    const data = await res.json();
    console.log('Parsed data:', data);
    setLines(data.lines);
  };

  const viewBox = useMemo(() => {
    if (lines.length === 0) return '0 0 100 100';

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const line of lines) {
      const points = [line.start, line.end];
      for (const pt of points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    const padding = 200;
    const width = maxX - minX;
    const height = maxY - minY;

    return `${minX - padding} ${-maxY - padding} ${width + padding * 2} ${height + padding * 2}`;
  }, [lines]);

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">DXF Parser Demo (App Router)</h1>
      <input type="file" accept=".dxf" onChange={handleUpload} className="mb-4" />

      <svg viewBox={viewBox} style={{ width: '100%', height: 'auto', border: '1px solid black' }}>
        {lines.map((l, idx) => (
          <line
            key={idx}
            x1={l.start.x}
            y1={-l.start.y}
            x2={l.end.x}
            y2={-l.end.y}
            stroke={l.color || "hotpink"}
            strokeWidth={1}
          />
        ))}
      </svg>
    </main>
  );
}
