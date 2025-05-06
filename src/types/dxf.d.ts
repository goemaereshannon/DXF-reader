// types/dxf.d.ts
declare module 'dxf-parser' {
    export default class DxfParser {
      parseSync(content: string): DxfDocument;
    }
  
    export interface DxfDocument {
      entities: DxfEntity[];
      tables?: {
        layers?: DxfLayer[];
      };
    }
  
    export interface DxfEntity {
      type: string;
      layer: string;
      color?: number;
      start?: { x: number; y: number };
      end?: { x: number; y: number };
      // voeg andere eigenschappen toe indien nodig
    }
  
    export interface DxfLayer {
      name: string;
      colorNumber: number;
    }
  }
  