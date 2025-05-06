import { NextRequest, NextResponse } from 'next/server';
import DxfParser, { DxfDocument } from 'dxf-parser';

type LineEntity = { start: { x: number; y: number }; end: { x: number; y: number } };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const content = Buffer.from(arrayBuffer).toString();

    const parser = new DxfParser();
    const parsed = parser.parseSync(content);
    console.log('Parsed DXF:', parsed);

    const lines: LineEntity[] = parsed.entities
      .filter((entity) => entity.type === 'LINE')
      .map((line: any) => ({
        start: { x: line.vertices[0].x, y: line.vertices[0].y },
        end: { x: line.vertices[1].x, y: line.vertices[1].y },
        color: line.color || line.colorIndex || 'blue', // Voeg de kleur toe
        layer: line.layer, // Voeg de laag toe
      }));

    return NextResponse.json({ lines });
  } catch (err) {
    console.error('DXF parse error:', err);
    return NextResponse.json({ error: 'Failed to parse DXF file' }, { status: 500 });
  }
}

// function dxfColorToHex(colorNumber: number): string {
//     const aciToHex: Record<number, string> = {
//       1: '#FF0000', // red
//       2: '#FFFF00', // yellow
//       3: '#00FF00', // green
//       4: '#00FFFF', // cyan
//       5: '#0000FF', // blue
//       6: '#FF00FF', // magenta
//       7: '#FFFFFF', // white (black in dark UI)
//       8: '#808080', // gray
//       9: '#C0C0C0', // light gray
//       // Voeg meer ACI-kleuren toe indien nodig
//     };
//     return aciToHex[colorNumber] || '#000000';
//   }

// export async function POST(req: NextRequest) {
//   const formData = await req.formData();
//   const file = formData.get('file') as File;

//   if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

//   const arrayBuffer = await file.arrayBuffer();
//   const text = Buffer.from(arrayBuffer).toString('utf8');

//   const parser = new DxfParser();
//   let parsed: DxfDocument;

//   try {
//     parsed = parser.parseSync(text);
//   } catch (error) {
//     console.error('DXF parse error:', error);
//     return NextResponse.json({ error: 'Failed to parse DXF' }, { status: 400 });
//   }

//   const layerColors: Record<string, number> = {};
//   parsed.tables?.layers?.forEach(layer => {
//     layerColors[layer.name] = layer.colorNumber;
//   });

//   const lines = parsed.entities
//     .filter(entity => entity.type === 'LINE')
//     .map(line => ({
//       start: line.start,
//       end: line.end,
//       color: dxfColorToHex(line.color !== 256 ? line.color : layerColors[line.layer] ?? 7),
//     }));

//   return NextResponse.json({ lines });
// }
