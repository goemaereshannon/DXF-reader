'use client';

import { useState, useMemo } from 'react';

type Point = {
  x: number;
  y: number;
};

type Line = {
  type: 'LINE';
  start: Point;
  end: Point;
  color: string;
  layer: string;
};

type LwPolyline = {
  type: 'LWPOLYLINE';
  points: Point[];
  layer: string;
};

type Circle = {
  type: 'CIRCLE';
  center: Point;
  radius: number;
  layer: string;
};

type Arc = {
  type: 'ARC';
  center: Point;
  radius: number;
  start_angle: number;
  end_angle: number;
  layer: string;
};

type Insert = {
  type: 'INSERT';
  block_name: string;
  location: Point;
  layer: string;
};

type Entity = Line | LwPolyline | Circle | Arc | Insert;

export default function Home() {
  const [entities, setEntities] = useState<Entity[]>([]);

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
    setEntities(data.entities); // Update to handle 'entities' instead of just 'lines'
  };

  const viewBox = useMemo(() => {
    if (entities.length === 0) return '0 0 100 100';

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const entity of entities) {
      const points =
        entity.type === 'LINE'
          ? [entity.start, entity.end]
          : entity.type === 'LWPOLYLINE'
          ? entity.points
          : entity.type === 'CIRCLE'
          ? [{ x: entity.center.x - entity.radius, y: entity.center.y }] // Use leftmost point for circles
          : entity.type === 'ARC'
          ? [{ x: entity.center.x - entity.radius, y: entity.center.y }] // Use leftmost point for arcs
          : [entity.location]; // For INSERT (blocks)

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
  }, [entities]);

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">DXF Parser Demo (App Router)</h1>
      <input type="file" accept=".dxf" onChange={handleUpload} className="mb-4" />

      <svg viewBox={viewBox} style={{ width: '100%', height: 'auto', border: '1px solid black' }}>
        {entities.map((entity, idx) => {
          switch (entity.type) {
            case 'LINE':
              return <line key={idx} x1={entity.start.x} y1={-entity.start.y} x2={entity.end.x} y2={-entity.end.y} stroke={entity.color || 'black'} strokeWidth={1} />;

            case 'LWPOLYLINE':
              return <polyline key={idx} points={entity.points.map((p) => `${p.x},${-p.y}`).join(' ')} stroke={entity.color || 'black'} fill="none" strokeWidth={1} />;

            case 'CIRCLE':
              return <circle key={idx} cx={entity.center.x} cy={-entity.center.y} r={entity.radius} stroke={entity.color || 'black'} fill="none" strokeWidth={1} />;

            case 'ARC':
              // Since SVG doesn't have an arc element, we'll simulate it with path
              const startAngle = entity.start_angle;
              const endAngle = entity.end_angle;
              const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
              const startX = entity.center.x + entity.radius * Math.cos((Math.PI / 180) * startAngle);
              const startY = entity.center.y - entity.radius * Math.sin((Math.PI / 180) * startAngle);
              const endX = entity.center.x + entity.radius * Math.cos((Math.PI / 180) * endAngle);
              const endY = entity.center.y - entity.radius * Math.sin((Math.PI / 180) * endAngle);
              const d = `M${startX},${-startY} A${entity.radius},${entity.radius} 0 ${largeArcFlag} 1 ${endX},${-endY}`;
              return <path key={idx} d={d} stroke={entity.color || 'black'} fill="none" strokeWidth={1} />;

            case 'INSERT':
              return (
                <text key={idx} x={entity.location.x} y={-entity.location.y} fill={entity.color || 'black'}>
                  {entity.block_name}
                </text>
              );

            default:
              return null;
          }
        })}
      </svg>
    </main>
  );
}
