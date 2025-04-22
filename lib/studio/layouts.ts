import ForceSupervisor from "graphology-layout-force/worker";
import * as studioDefaultSettings from "./defaults.js";
import Graph from "graphology";
import MultiGraph from "graphology";
import {ForceLayoutSettings} from "graphology-layout-force";
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import {ForceAtlas2LayoutParameters} from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import noverlap, {NoverlapLayoutParameters} from "graphology-layout-noverlap";
import { Attributes } from "graphology-types";

export class Layouts {

    static createForceLayoutSupervisor(graph: MultiGraph, settings: ForceLayoutSettings | undefined): LayoutWrapper {
        if (settings == undefined) {
            settings = studioDefaultSettings.defaultForceSupervisorSettings;
        }
        let layout = new ForceSupervisor(graph, {
            isNodeFixed: (_, attr) => attr.highlighted,
            settings: settings,
        });
        return new LayoutSupervisorWrapper(graph, layout);
    }

    static createForceAtlasSupervisor(graph: MultiGraph, settings: ForceAtlas2LayoutParameters | undefined): LayoutWrapper {
        let layout = new FA2Layout(graph, settings);
        return new LayoutSupervisorWrapper(graph, layout);
    }

    static createLayoutNoOverlap(graph: MultiGraph, settings: NoverlapLayoutParameters | undefined): LayoutWrapper {
        let layout = new NoverlapWrapper();
        return new StaticLayoutWrapper(graph, layout, settings);
    }
}


export interface LayoutWrapper {
    start(): void;

    stop(): void;

    // For those that aren't actually animated:
    redraw(): void;
}

class LayoutSupervisorWrapper implements LayoutWrapper {
    private layout: ForceSupervisor | FA2LayoutSupervisor;
    private graph: MultiGraph;

    constructor(graph: MultiGraph, layout: ForceSupervisor | FA2LayoutSupervisor) {
        this.graph = graph;
        this.layout = layout;
    }

    start() {
        this.layout.start();
    }

    stop() {
        this.layout.stop();
    }

    redraw() {
        this.stop();
        this.graph.nodes().forEach(node => {
            this.graph.setNodeAttribute(node, "x", Math.random());
            this.graph.setNodeAttribute(node, "y", Math.random());
        })
        this.start();
    }
}

interface StaticLayoutInner<LayoutParams> {
    assign(graph: MultiGraph, params: LayoutParams | undefined): void;
}

class StaticLayoutWrapper<LayoutParams> implements LayoutWrapper {
    private graph: Graph;
    private layout: StaticLayoutInner<LayoutParams>;
    private params: LayoutParams | undefined;

    constructor(graph: MultiGraph, layout: StaticLayoutInner<LayoutParams>, params: LayoutParams | undefined) {
        this.graph = graph;
        this.layout = layout;
        this.params = params;
    }

    start(): void {
    }

    stop(): void {
    }

    redraw(): void {
        this.layout.assign(this.graph, this.params);
    }
}

class NoverlapWrapper implements StaticLayoutInner<NoverlapLayoutParameters> {
    static DEFAULT_MAX_ITERATIONS: number = 50;
    assign(graph: MultiGraph, params: NoverlapLayoutParameters | undefined): void {
        if (params == undefined) {
            noverlap.assign(graph, { maxIterations: NoverlapWrapper.DEFAULT_MAX_ITERATIONS });
        } else {
            noverlap.assign(graph, params);
        }

    }
}
