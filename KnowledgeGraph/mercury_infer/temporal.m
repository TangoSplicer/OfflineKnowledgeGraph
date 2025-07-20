:- module temporal.
:- interface.

:- import_module types.

:- pred infer_temporal(graph::in, list(fact)::out) is det.

:- implementation.

infer_temporal(Graph, Facts) :-
    ( if list.member(entity(_, "EventX", event, _), Graph^nodes) then
        Facts = [inferred("temporal_inference(EventX)")]
    else
        Facts = []
    ).