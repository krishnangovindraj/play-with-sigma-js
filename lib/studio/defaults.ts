import {EdgeKind, RoleType, ThingKind, TypeKind} from "../typedb/concept";
import chroma from "chroma-js";
import {LogicalVertex, SpecialVertexKind, VertexUnavailable} from "../graph";
import {NodeSquareProgram} from "@sigma/node-square";
import {ForceLayoutSettings} from "graphology-layout-force";
import {Settings as SigmaSettings} from "sigma/settings";
import {unavailable_key} from "./converter";
import {StudioConverterStructureParameters, StudioConverterStyleParameters} from "./config";

export const defaultStyleParameters: StudioConverterStyleParameters = {
    vertex_colors: {
        [ThingKind.entity]: chroma("pink"),
        [ThingKind.relation]: chroma("yellow"),
        [ThingKind.attribute]: chroma("green"),
        [TypeKind.entityType]: chroma("magenta"),
        [TypeKind.relationType]: chroma("orange"),
        [TypeKind.attributeType]: chroma("darkgreen"),
        [TypeKind.roleType]: chroma("darkorange"),
        value: chroma("white"),
        [SpecialVertexKind.unavailable]: chroma("darkgrey"),
        [SpecialVertexKind.expr]: chroma("black"),
        [SpecialVertexKind.func]: chroma("black")
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
        [SpecialVertexKind.unavailable]: "circle",
        [SpecialVertexKind.expr]: "circle",
        [SpecialVertexKind.func]: "circle",
    },
    vertex_size: 10,

    edge_color: chroma("grey"),
    edge_highlight_color: chroma("cyan"),
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
            case SpecialVertexKind.unavailable: {
                return "?" + vertex.variable + "?";
            }
            case SpecialVertexKind.func:
            case SpecialVertexKind.expr: {
                return vertex.repr;
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
                return vertex.valueType +":" + vertex.value;
            }
            case SpecialVertexKind.unavailable: {
                return unavailable_key(vertex);
            }
            case SpecialVertexKind.func:
            case SpecialVertexKind.expr: {
                return vertex.repr;
            }
        }
    },

    links_edge_label(role: RoleType | VertexUnavailable): string {
        return this.vertex_default_label(role);
    }
};

export const defaultStructureParameters: StudioConverterStructureParameters = {
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
    attraction: 0.0005,
    repulsion: 0.1,
    gravity: 0.0001,
    inertia: 0.6,
    maxMove: 200,
};
