import { Shape } from "./shape";

export interface ImageWithMetadata {
    file: File; // Image is a file
    metadata: Shape[] | null; // Metadata (label, shape (rectangle, circle...), etc.)
}