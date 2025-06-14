# TypeDB visualisation tool
This was the development bed for the graph visualiser and has since been repurposed to visualise saved graphs, and hopefully allow some customisation.
To customise colours, go to `lib/defaults.ts` and play around with the styling objects.

## Usage
Run `npm run build` to generate `typedb-visualisation.js`
Just open `index.html` in your browser.

The format expected is the full JSON response returned by the TypeDB HTTP API on a pipelined query (without a fetch).
See `ConceptRowsQueryResponse` in [response.ts](src/typedb-driver/response.ts).

### Loading the query & response from a url
For this, you can't open `index.html` using `file:///`.
You will need to run a server at the project root (e.g. `python3 -m http.server 8080`).

Then, you can do: `http://127.0.0.1:8080/?query=sample-data/query.txt&graph=sample-data/graph.json`
Replace  `sample-data/query.txt` and `sample-data/graph.json` with your files.

## Other notes
* You can drag. When using a `LayoutSupervisor`, the animation can be unfrozen & frozen using the buttons.
* There are some extra layouts available under `layouts.ts`. 
  - You can also implement your own. 
  ```typescript
        // this.graph is a graphology graph. Assume you've computed positions. 
        this.graph.nodes().forEach(node => {
            graph.setNodeAttribute(node, "x", positions[node].x);
            graph.setNodeAttribute(node, "y", positions[node].y);
        })
  ```
* From the console, Edges from a specific answer(here at index 0) can be
  - highlighted using `visualiser.interactionHandler.highlightAnswer(0)`
  - unhighlighted using `visualiser.interactionHandler.removeHighlightFromAnswer(0)` in console
  - 