import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const backendRes = await fetch('http://localhost:5000/parse-dxf', {
      method: 'POST',
      body: (() => {
        const form = new FormData();
        form.append('file', new Blob([buffer]), file.name);
        return form;
      })(),
    });

    if (!backendRes.ok) {
      const text = await backendRes.text();
      console.error('Python backend error:', text);
      return NextResponse.json({ error: 'DXF parsing failed' }, { status: 502 });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('API proxy error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}