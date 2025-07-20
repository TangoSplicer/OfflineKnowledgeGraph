:- module reasoner.
:- interface.

:- import_module types.

:- pred run_inference(graph::in, list(rule)::in, inference_result::out) is det.

:- implementation.

run_inference(Graph, Rules, Result) :-
    apply_rules(Graph, Rules, [], Facts),
    ( if contradiction_present(Facts) then
        Result = invalid(Facts)
    else
        Result = valid(Facts)
    ).

:- pred apply_rules(graph::in, list(rule)::in, list(fact)::in, list(fact)::out) is det.
apply_rules(_, [], Acc, Acc).
apply_rules(Graph, [R | Rs], Acc, Facts) :-
    Fs = R^apply(Graph),
    apply_rules(Graph, Rs, Fs ++ Acc, Facts).

:- pred contradiction_present(list(fact)::in) is semidet.
contradiction_present(Facts) :-
    list.member(contradiction(_), Facts).