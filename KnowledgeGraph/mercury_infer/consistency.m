:- module consistency.
:- interface.

:- import_module types.

:- pred audit_graph(graph::in, list(fact)::out) is det.

:- implementation.

audit_graph(Graph, Facts) :-
    ( if list.length(Graph^nodes) = 0 then
        Facts = [contradiction("Graph has no nodes")]
    else if list.length(Graph^edges) = 0 then
        Facts = [contradiction("No relations between entities")]
    else
        Facts = []
    ).