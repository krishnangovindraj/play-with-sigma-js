`npm run build`

And serve somehow. Example: `python3 -m http.server 8001`

Non-obvious things:
* You can drag
* Double click "explores" a node's neighbourhood
* Edges from a specific answer(here at index 0)  can be
  - highlighted using `studio.interactionHandler.highlightAnswer(0)`
  - unhighlighted using `studio.interactionHandler.removeHighlightFromAnswer(0)` in console