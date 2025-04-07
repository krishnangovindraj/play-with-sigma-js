import {EdgeKind, RoleType, ThingKind, TypeKind} from "../typedb/concept.js";
import chroma from "chroma-js";
import {LogicalVertex, VertexUnavailable} from "../graph.js";
import {NodeSquareProgram} from "@sigma/node-square";
import {ForceLayoutSettings} from "graphology-layout-force";
import {Settings as SigmaSettings} from "sigma/settings";

export const defaultStyleParameters = {
    vertex_colors: {
        [ThingKind.entity]: chroma("pink"),
        [ThingKind.relation]: chroma("yellow"),
        [ThingKind.attribute]: chroma("green"),
        [TypeKind.entityType]: chroma("magenta"),
        [TypeKind.relationType]: chroma("orange"),
        [TypeKind.attributeType]: chroma("darkgreen"),
        [TypeKind.roleType]: chroma("darkorange"),
        value: chroma("grey"),
        unavailable: chroma("darkgrey"),
    },
    vertex_shapes: {
        [ThingKind.entity]: "circle",
        [ThingKind.relation]: "square",
        [ThingKind.attribute]: "circle",
        [TypeKind.entityType]: "circle",
        [TypeKind.relationType]: "square",
        [TypeKind.attributeType]: "circle",
        [TypeKind.roleType]: "circle",
        value: "circle",
        unavailable: "circle",
    },
    vertex_size: 10,

    edge_color: chroma("grey"),
    edge_size: 4,

    vertex_default_label(vertex: LogicalVertex): string {
        switch (vertex.kind) {
            case TypeKind.entityType:
            case TypeKind.relationType:
            case TypeKind.roleType:
            case TypeKind.attributeType: {
                return vertex.label;
            }

            case ThingKind.entity:
            case ThingKind.relation:{
                return vertex.type.label;
            }
            case ThingKind.attribute: {
                return vertex.value;
            }
            case "value": {
                return vertex.value;
            }
            case "unavailable": {
                return "?";
            }
        }
    },

    vertex_hover_label(vertex: LogicalVertex): string {
        switch (vertex.kind) {
            case TypeKind.entityType:
            case TypeKind.relationType:
            case TypeKind.roleType:
            case TypeKind.attributeType: {
                return vertex.label;
            }

            case ThingKind.entity:
            case ThingKind.relation: {
                return vertex.type.label + ":" + vertex.iid;
            }
            case ThingKind.attribute: {
                return vertex.type.label + ":" + vertex.value;
            }
            case "value": {
                return vertex.value_type +":" + vertex.value;
            }
            case "unavailable": {
                return "?";
            }
        }
    },

    links_edge_label(role: RoleType | VertexUnavailable): string {
        return this.vertex_default_label(role);
    }
};

export const defaultStructureParameters = {
    ignoreEdgesInvolvingLabels: [EdgeKind.isa, EdgeKind.sub, EdgeKind.relates, EdgeKind.plays],
};

export const defaultSigmaSettings: Partial<SigmaSettings> = {
    minCameraRatio: 0.1,
    maxCameraRatio: 10,
    renderEdgeLabels: true,
    nodeProgramClasses: {
        square: NodeSquareProgram,
    },
};

export const defaultForceSupervisorSettings: ForceLayoutSettings = {
    attraction: 0.0002,
    repulsion: 0.1,
    gravity: 0.0001,
    inertia: 0.6,
    maxMove: 10,
};
