import { Shape } from "./shape";

export interface ImageWithMetadata {
    file: File; // La imagen como archivo File
    metadata: Shape[] | null; // Los metadatos asociados (formas, datos, etc.)
}