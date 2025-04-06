import {LogicalVertex, LogicalVertexKind, VertexUnavailable} from "../graph.js";
import {Color} from "chroma-js";
import {RoleType} from "../typedb/concept.js";

export interface StudioConverterStyleParameters {
    vertex_colors: Record<LogicalVertexKind, Color>,
    vertex_shapes: Record<LogicalVertexKind, string>,
    vertex_size: number,

    edge_color: Color,
    edge_size: number

    vertex_label: (vertex: LogicalVertex) => string;
    links_edge_label: (role: RoleType | VertexUnavailable) => string;
}
