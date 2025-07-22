:- module reasoner.
:- interface.

:- import_module types.

:- pred run_inference(graph::in, list(rule)::in, maybe_error(inference_result)::out) is det.

:- implementation.

run_inference(Graph, Rules, Result) :-
    try(
        (pred(Res::out) is det :-
            apply_rules(Graph, Rules, [], Facts),
            ( if contradiction_present(Facts) then
                Res = invalid(Facts)
            else
                Res = valid(Facts)
            )
        ),
        MaybeResult
    ),
    (
        MaybeResult = ok(InferenceResult),
        Result = ok(InferenceResult)
    ;
        MaybeResult = exception(E),
        Result = error(string.format("Error during inference: %s", [s(string(E))]))
    ).

:- pred apply_rules(graph::in, list(rule)::in, list(fact)::in, list(fact)::out) is det.
apply_rules(_, [], Acc, Acc).
apply_rules(Graph, [R | Rs], Acc, Facts) :-
    ( if R^applicable(Graph) then
        Fs = R^apply(Graph),
        apply_rules(Graph, Rs, Fs ++ Acc, Facts)
    else
        apply_rules(Graph, Rs, Acc, Facts)
    ).

:- pred contradiction_present(list(fact)::in) is semidet.
contradiction_present(Facts) :-
    list.member(contradiction(_), Facts).