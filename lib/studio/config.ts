import {LogicalVertex, LogicalVertexKind, VertexUnavailable} from "../graph";
import {Color} from "chroma-js";
import {EdgeKind, RoleType} from "../typedb/concept";

export interface StudioConverterStyleParameters {
    vertex_colors: Record<LogicalVertexKind, Color>,
    vertex_shapes: Record<LogicalVertexKind, string>,
    vertex_size: number,

    edge_color: Color,
    edge_size: number

    vertex_default_label: (vertex: LogicalVertex) => string;
    vertex_hover_label: (vertex: LogicalVertex) => string;
    links_edge_label: (role: RoleType | VertexUnavailable) => string;
}

export interface StudioConverterStructureParameters {
    ignoreEdgesInvolvingLabels: Array<EdgeKind>,
}
