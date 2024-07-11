export interface Polygon {
    type: 'polygon';
    points: { x: number; y: number }[];
    color: string;
    label: string;
    thickness: number;
}
