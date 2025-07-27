:- module json.
:- interface.

:- import_module io, json, types.

:- pred get_graph(json.value::in, types.graph::out) is det.
:- pred graph_to_facts(types.graph::in, list(string)::out) is det.

:- implementation.

get_graph(Value, Graph) :-
    ( if
        Value = json.object(Map),
        json.search(Map, "nodes", NodesValue),
        json.search(Map, "edges", EdgesValue),
        NodesValue = json.array(Nodes),
        EdgesValue = json.array(Edges)
    then
        Graph = graph(json_to_nodes(Nodes), json_to_edges(Edges))
    else
        Graph = graph([], [])
    ).

graph_to_facts(Graph, Facts) :-
    Graph = graph(Nodes, Edges),
    NodesFacts = nodes_to_facts(Nodes),
    EdgesFacts = edges_to_facts(Edges),
    append(NodesFacts, EdgesFacts, Facts).

:- pred json_to_nodes(list(json.value)::in, list(types.node)::out) is det.
json_to_nodes([], []).
json_to_nodes([Value | Values], [Node | Nodes]) :-
    ( if
        Value = json.object(Map),
        json.search(Map, "id", IdValue),
        json.search(Map, "label", LabelValue),
        IdValue = json.string(Id),
        LabelValue = json.string(Label)
    then
        Node = node(Id, Label)
    else
        Node = node("", "")
    ),
    json_to_nodes(Values, Nodes).

:- pred json_to_edges(list(json.value)::in, list(types.edge)::out) is det.
json_to_edges([], []).
json_to_edges([Value | Values], [Edge | Edges]) :-
    ( if
        Value = json.object(Map),
        json.search(Map, "from", FromValue),
        json.search(Map, "to", ToValue),
        json.search(Map, "label", LabelValue),
        FromValue = json.string(From),
        ToValue = json.string(To),
        LabelValue = json.string(Label)
    then
        Edge = edge(From, To, Label)
    else
        Edge = edge("", "", "")
    ),
    json_to_edges(Values, Edges).

:- pred nodes_to_facts(list(types.node)::in, list(string)::out) is det.
nodes_to_facts([], []).
nodes_to_facts([Node | Nodes], [Fact | Facts]) :-
    Node = node(Id, Label),
    Fact = "node(" ++ Id ++ ", \"" ++ Label ++ "\").",
    nodes_to_facts(Nodes, Facts).

:- pred edges_to_facts(list(types.edge)::in, list(string)::out) is det.
edges_to_facts([], []).
edges_to_facts([Edge | Edges], [Fact | Facts]) :-
    Edge = edge(From, To, Label),
    Fact = "edge(" ++ From ++ ", " ++ To ++ ", \"" ++ Label ++ "\").",
    edges_to_facts(Edges, Facts).
