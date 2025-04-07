import {LogicalVertex, StructureEdgeCoordinates, VertexUnavailable} from "../graph";
import chroma from "chroma-js";
import {
    Attribute,
    AttributeType,
    EdgeKind,
    Entity,
    EntityType,
    ObjectAny,
    ObjectType,
    Relation,
    RelationType,
    RoleType,
    ThingKind,
    TypeKind
} from "../typedb/concept";
import {ITypeDBToGraphology} from "../visualisation";
import Graph from "graphology";
import {StudioConverterStructureParameters, StudioConverterStyleParameters} from "./config";
import {StructureEdge, StructureVertexKind, TypeDBQueryStructure} from "../typedb/answer.js";
import * as defaultSettings from "./defaults";

export class StudioConverter implements ITypeDBToGraphology {
    styleParameters: StudioConverterStyleParameters;
    structureParameters: StudioConverterStructureParameters;
    edgesToDraw: Array<Array<number>>;

    static defaultSigmaSettings: any;
    static defaultStyleParameters: StudioConverterStyleParameters;
    static defaultStructureParameters: StudioConverterStructureParameters;

    constructor(queryStructure: TypeDBQueryStructure, structureParameters: StudioConverterStructureParameters, styleParameters: StudioConverterStyleParameters) {
        this.edgesToDraw = determineEdgesToDraw(queryStructure, structureParameters);
        this.styleParameters = styleParameters;
        this.structureParameters = structureParameters;
    }

    vertexAttributes(vertex: LogicalVertex): any {
        // Extend as you please: https://www.sigmajs.org/docs/advanced/data/
        let color = this.styleParameters.vertex_colors[vertex.kind];
        let shape = this.styleParameters.vertex_shapes[vertex.kind];
        return {
            label: this.styleParameters.vertex_default_label(vertex),
            color: color.hex(),
            size: this.styleParameters.vertex_size,
            type: shape,
            x: Math.random(),
            y: Math.random(),
            metadata: {
                default_label: this.styleParameters.vertex_default_label(vertex),
                hover_label: this.styleParameters.vertex_hover_label(vertex),
            },
        }
    }

    edgeAttributes(label: string, metadata: any | undefined): any {
        // Extend as you please: https://www.sigmajs.org/docs/advanced/data/
        let color = this.styleParameters.edge_color;
        return {
            label: label,
            color: color.hex(),
            size: this.styleParameters.edge_size,
            type: "arrow",
            metadata: metadata
        }
    }

    edgeKey(from_id: string, to_id: string, edge_type_id: string) : string {
        return from_id + ":" + to_id + ":" + edge_type_id;
    }

    mayAddNode(graph: Graph, structureEdgeCoordinates: StructureEdgeCoordinates, key: string, attributes: any) {
        if (this.shouldDrawEdge(structureEdgeCoordinates)) {
            if (!graph.hasNode(key)) {
                graph.addNode(key, attributes);
            }
        }
    }

    mayAddEdge(graph:Graph, coordinates: StructureEdgeCoordinates, from: string, to:string, edge_label:string, attributes: any) {
        if (this.shouldDrawEdge(coordinates)) {
            let key = this.edgeKey(from, to, edge_label);
            if (!graph.hasDirectedEdge(key)) {
                graph.addDirectedEdgeWithKey(key, from, to, attributes)
            }
        }
    }

    // ITypeDBToGraphology
    // Vertices
    put_attribute(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: Attribute): void {
        this.mayAddNode(graph, structureEdgeCoordinates, vertex.iid, this.vertexAttributes(vertex));
    }

    put_entity(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: Entity): void {
        this.mayAddNode(graph, structureEdgeCoordinates, vertex.iid, this.vertexAttributes(vertex));
    }

    put_relation(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: Relation): void {
        this.mayAddNode(graph, structureEdgeCoordinates, vertex.iid, this.vertexAttributes(vertex));
    }
    put_attribute_type(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: AttributeType): void {
        this.mayAddNode(graph, structureEdgeCoordinates, vertex.label, this.vertexAttributes(vertex));
    }
    put_entity_type(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: EntityType): void {
        this.mayAddNode(graph, structureEdgeCoordinates, vertex.label, this.vertexAttributes(vertex));
    }
    put_relation_type(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: RelationType): void {
        this.mayAddNode(graph, structureEdgeCoordinates, vertex.label, this.vertexAttributes(vertex));
    }

    put_role_type_for_type_constraint(graph: Graph, answerIndex: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: RoleType): void {
        let label = vertex.label;
        if (!graph.hasNode(vertex.label)) {
            graph.addNode(vertex.label, { label: label, color: chroma('darkorange').alpha(0.5).hex(), size: 5, x: Math.random(), y: Math.random() });
        }
    }

    // Edges
    put_isa(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, thing: Attribute | ObjectAny, type: AttributeType | ObjectType): void {
        let attributes = this.edgeAttributes(EdgeKind.isa, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, thing.iid, type.label, EdgeKind.isa, attributes);
    }

    put_has(graph: Graph,  answerIndex: number, coordinates: StructureEdgeCoordinates, owner: Entity | Relation, attribute: Attribute): void {
        let attributes = this.edgeAttributes(EdgeKind.has, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates,owner.iid, attribute.iid, EdgeKind.has, attributes);
    }

    put_links(graph: Graph,  answerIndex: number, coordinates: StructureEdgeCoordinates, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void {
        let role_label = (role.kind == TypeKind.roleType) ?
            (role as RoleType).label :
            ("links_[" + coordinates.branchIndex + "," + coordinates.constraintIndex + "]");
        let attributes = this.edgeAttributes(role_label, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, relation.iid, player.iid, role_label, attributes);
    }

    put_sub(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, subtype: AttributeType | ObjectType, supertype: AttributeType | ObjectType): void {
        let attributes = this.edgeAttributes(EdgeKind.sub, coordinates);
        this.mayAddEdge(graph, coordinates, subtype.label, supertype.label, EdgeKind.sub, attributes);
    }

    put_owns(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, owner: ObjectType, attribute: AttributeType): void {
        let attributes = this.edgeAttributes(EdgeKind.owns, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, owner.label, attribute.label, EdgeKind.owns, attributes);
    }

    put_relates(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, relation: RelationType, role: RoleType): void {
        let attributes = this.edgeAttributes(EdgeKind.relates, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, relation.label, role.label, EdgeKind.relates, attributes);
    }

    put_plays(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, player: EntityType | RelationType, role: RoleType): void {
        let attributes = this.edgeAttributes(EdgeKind.plays, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, player.label, role.label, EdgeKind.plays, attributes);
    }

    put_isa_exact(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, thing: Attribute | ObjectAny, type: AttributeType | ObjectType): void {
        let attributes = this.edgeAttributes(EdgeKind.isaExact, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, thing.iid, type.label, EdgeKind.isaExact, attributes);
    }

    put_sub_exact(graph: Graph, answerIndex: number, coordinates: StructureEdgeCoordinates, subtype: AttributeType | ObjectType, supertype: AttributeType | ObjectType): void {
        let attributes = this.edgeAttributes(EdgeKind.subExact, this.edgeMetadata(answerIndex, coordinates));
        this.mayAddEdge(graph, coordinates, subtype.label, supertype.label, EdgeKind.subExact, attributes);
    }

    private shouldDrawEdge(edgeCoordinates: StructureEdgeCoordinates) {
        return this.edgesToDraw[edgeCoordinates.branchIndex].includes(edgeCoordinates.constraintIndex);
    }

    private edgeMetadata(answerIndex: number, coordinates: StructureEdgeCoordinates) {
        return { answerIndex: answerIndex, structureEdgeCoordinates: coordinates };
    }
}

function determineEdgesToDraw(queryStructure: TypeDBQueryStructure, structureParameters: StudioConverterStructureParameters): Array<Array<number>> {
    let edgesToDraw: Array<Array<number>> = [];
    queryStructure.branches.forEach((_) => {
        edgesToDraw.push([]);
    });
    queryStructure.branches.flatMap((branch, branchIndex) =>
        branch.edges.map((edge, constraintIndex) => {
            return {edge: edge, coordinates: {branchIndex: branchIndex, constraintIndex: constraintIndex}};
        })
    ).filter((element) => mustDrawEdge(element.edge, structureParameters))
    .forEach((element) => {
        edgesToDraw[element.coordinates.branchIndex].push(element.coordinates.constraintIndex);
    });
    return edgesToDraw;
}

function mustDrawEdge(edge: StructureEdge, structureParameters: StudioConverterStructureParameters) : boolean {
    let isLabelledEdge = (edge.from.kind == StructureVertexKind.label || edge.to.kind == StructureVertexKind.label);
    if (isLabelledEdge && structureParameters.ignoreEdgesInvolvingLabels.includes(edge.type.kind)) {
        return false;
    }
    return true;
}

StudioConverter.defaultStyleParameters = defaultSettings.defaultStyleParameters;
StudioConverter.defaultStructureParameters = defaultSettings.defaultStructureParameters;
StudioConverter.defaultSigmaSettings = defaultSettings.defaultSigmaSettings;
