import { Shape } from "./shape";

export interface ImageWithMetadata {
    id: string; // Unique identifier for the image
    file: File; // Image is a file
    metadata: Shape[] | null; // Metadata (label, shape (rectangle, circle...), etc.)
}