import Sigma from "sigma";
import Graph from "graphology";
import {SigmaEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload} from "sigma/types";

// Ref: https://www.sigmajs.org/docs/advanced/events/
// and: https://www.sigmajs.org/storybook/?path=/story/mouse-manipulations--story

interface InteractionState {
    draggedNode: string | null;
}

export class StudioInteractionHandler {
    graph: Graph;
    renderer: Sigma;
    state: InteractionState;
    constructor(graph: Graph, renderer: Sigma) {
        this.graph = graph;
        this.renderer = renderer;
        this.state = {
            draggedNode : null,
        };
        this.registerAll(renderer);
    }

    registerAll(renderer: Sigma) {
        renderer.on(StudioSigmaEventType.moveBody, (e) => this.onMoveBody(e));
        renderer.on(StudioSigmaEventType.downNode, (e) => this.onDownNode(e));

        renderer.on(StudioSigmaEventType.upStage, (e) => this.onUpStage(e));
        renderer.on(StudioSigmaEventType.upNode, (e) => this.onUpNode(e));
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
