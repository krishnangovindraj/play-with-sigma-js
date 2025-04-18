import Sigma from "sigma";
import Graph from "graphology";
import {SigmaEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload} from "sigma/types";
import {StudioConverterStyleParameters} from "./config";
import {StudioDriverWrapper} from "./driverwrapper";
import {ThingKind, TypeKind} from "../typedb/concept";
import {StudioState} from "./studio";
import {TypeDBAnswerAny, TypeDBQueryType} from "../typedb/answer.js";
import {TypeDBResult} from "../typedb/driver.js";

// Ref: https://www.sigmajs.org/docs/advanced/events/
// and: https://www.sigmajs.org/storybook/?path=/story/mouse-manipulations--story

interface InteractionState {
    draggedNode: string | null;
    highlightedAnswer: number | null; // demonstrative
}

export class StudioInteractionHandler {
    graph: Graph;
    renderer: Sigma;
    state: InteractionState;
    styleParameters: StudioConverterStyleParameters;
    driver: StudioDriverWrapper;
    private studioState: StudioState;

    constructor(graph: Graph, renderer: Sigma, driver: StudioDriverWrapper, studioState: StudioState, styleParameters: StudioConverterStyleParameters) {
        this.graph = graph;
        this.renderer = renderer;
        this.state = {
            draggedNode : null,
            highlightedAnswer: null,
        };
        this.studioState = studioState;
        this.styleParameters = styleParameters;
        this.driver = driver;
        this.registerAll(renderer);
    }

    registerAll(renderer: Sigma) {
        renderer.on(StudioSigmaEventType.enterNode, (e) => this.onEnterNode(e));
        renderer.on(StudioSigmaEventType.leaveNode, (e) => this.onLeaveNode(e));

        renderer.on(StudioSigmaEventType.moveBody, (e) => this.onMoveBody(e));
        renderer.on(StudioSigmaEventType.downNode, (e) => this.onDownNode(e));

        renderer.on(StudioSigmaEventType.upStage, (e) => this.onUpStage(e));
        renderer.on(StudioSigmaEventType.upNode, (e) => this.onUpNode(e));

        renderer.on(StudioSigmaEventType.doubleClickNode, (e) => this.onDoubleClickNode(e));
    }

    onEnterNode(event: SigmaNodeEventPayload) {
        let node = event.node;
        this.graph.setNodeAttribute(node, "highlighted", true);
        this.graph.setNodeAttribute(node, "label", this.graph.getNodeAttributes(node).metadata.hoverLabel)
    }

    onLeaveNode(event: SigmaNodeEventPayload) {
        let node = event.node;
        this.graph.setNodeAttribute(node, "highlighted", false);
        this.graph.setNodeAttribute(node, "label", this.graph.getNodeAttributes(node).metadata.defaultLabel);
    }


    onDownNode(event: SigmaNodeEventPayload) {
        let node = event.node;
        this.state.draggedNode = node;
        this.graph.setNodeAttribute(node, "highlighted", true);
        if (!this.renderer.getCustomBBox()) {
            this.renderer.setCustomBBox(this.renderer.getBBox());
        }
    }

    onMoveBody(event: SigmaStageEventPayload) {
        // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
        let mouseCoords = event.event;
        if (this.state.draggedNode == null) return;

        // Get new position of node
        const pos = this.renderer.viewportToGraph(mouseCoords);
        this.graph.setNodeAttribute(this.state.draggedNode, "x", pos.x);
        this.graph.setNodeAttribute(this.state.draggedNode, "y", pos.y);

        // Prevent sigma to move camera:
        mouseCoords.preventSigmaDefault();
        mouseCoords.original.preventDefault();
        mouseCoords.original.stopPropagation();
    }

    onUpNode(event: SigmaNodeEventPayload) {
        if (this.state.draggedNode != null) {
            this.graph.removeNodeAttribute(this.state.draggedNode, "highlighted");
            this.state.draggedNode = null;
        }
    }

    onUpStage(event: SigmaEventPayload) {
        if (this.state.draggedNode != null) {
            this.graph.removeNodeAttribute(this.state.draggedNode, "highlighted");
            this.state.draggedNode = null;
        }
    }

    onDoubleClickNode(event: SigmaNodeEventPayload) {
        let node = event.node;
        let attributes = this.graph.getNodeAttributes(node);
        if (this.studioState.activeQueryDatabase == null) {
            console.log("Could not dispatch explore query: Unknown active database") // unreachable
            return;
        }
        let query = null;
        switch(attributes.metadata.concept.kind) {
            case TypeKind.entityType: {
                query = QUERY_EXPLORE_ENTITYTYPE.replace("<<label>>", attributes.metadata.concept.label);
                break;
            }
            case TypeKind.relationType: {
                query = QUERY_EXPLORE_RELATIONTYPE.replace("<<label>>", attributes.metadata.concept.label);
                break;
            }
            case TypeKind.attributeType:{
                query = QUERY_EXPLORE_ATTRIBUTETYPE.replace("<<label>>", attributes.metadata.concept.label);
                break;
            }
            case TypeKind.roleType: {
                query = QUERY_EXPLORE_ROLETYPE.replace("<<label>>", attributes.metadata.concept.label);
                break;
            }
            case ThingKind.entity: {
                query = QUERY_EXPLORE_ENTITY.replace("<<iid>>", attributes.metadata.concept.label);
                break;
            }
            case ThingKind.relation: {
                query = QUERY_EXPLORE_RELATION.replace("<<iid>>", attributes.metadata.concept.label);
                break;
            }
            case ThingKind.attribute: {
                query = QUERY_EXPLORE_ATTRIBUTE.replace("<<iid>>", attributes.metadata.concept.label);
                break;
            }
            default: {
                console.log("Unexplorable kind: " + attributes.metadata.concept.kind);
                return;
            }
        }
        let result = this.driver.runExplorationQuery(this.studioState.activeQueryDatabase, query, TypeDBQueryType.read);
    }

    highlightAnswer(answerIndex: number) {
        // TODO: Maybe add indexing so I don't have to iterate
        if (this.state.highlightedAnswer != null) {
            this.removeHighlightFromAnswer(this.state.highlightedAnswer);
            this.state.highlightedAnswer = null;
        }
        this.graph.edges().forEach(edge => {
            if (answerIndex == this.graph.getEdgeAttributes(edge).metadata.answerIndex) {
                this.graph.setEdgeAttribute(edge, "color", this.styleParameters.edge_highlight_color.hex());
            }
        })
        this.state.highlightedAnswer = answerIndex;
    }

    removeHighlightFromAnswer(answerIndex: number) {
        // TODO: Maybe add indexing so I don't have to iterate
        this.graph.edges().forEach(edge => {
            if (answerIndex == this.graph.getEdgeAttributes(edge).metadata.answerIndex) {
                this.graph.setEdgeAttribute(edge, "color", this.styleParameters.edge_color.hex());
            }
        })
    }
}

enum StudioSigmaEventType {
    enterNode = "enterNode",
    leaveNode = "leaveNode",
    downNode = "downNode",
    upNode = "upNode",
    clickNode = "clickNode",
    rightClickNode = "rightClickNode",
    doubleClickNode = "doubleClickNode",
    wheelNode = "wheelNode",

    enterEdge = "enterEdge",
    leaveEdge = "leaveEdge",
    downEdge = "downEdge",
    clickEdge = "clickEdge",
    rightClickEdge = "rightClickEdge",
    doubleClickEdge = "doubleClickEdge",
    wheelEdge = "wheelEdge",

    moveBody = "moveBody",
    upStage = "upStage",

    // Remaining: downStage, clickStage, rightClickStage, doubleClickStage, wheelStage
    // Remaining: beforeRender, afterRender, resize, kill
}

const QUERY_EXPLORE_ENTITY = "";
const QUERY_EXPLORE_RELATION = "";
const QUERY_EXPLORE_ATTRIBUTE = "";


const QUERY_EXPLORE_ENTITYTYPE = "";
const QUERY_EXPLORE_RELATIONTYPE = "";
const QUERY_EXPLORE_ATTRIBUTETYPE = "";

const QUERY_EXPLORE_ROLETYPE = "";