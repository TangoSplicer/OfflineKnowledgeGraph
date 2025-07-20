:- module rules.
:- interface.
:- import_module facts.
:- import_module list.

:- pred infer(fact::in, fact::out) is semidet.
:- pred apply_inference_rules(list(fact)::in, list(fact)::out) is det.

%----------------------------------------
:- implementation.

infer(
    fact(entity(X), relation("works-on"), entity(Y)),
    fact(entity(X), relation("likely-familiar-with"), entity(Z))
) :-
    % Look for secondary fact in global list
    facts::example_facts(Facts),
    list.member(fact(entity(Y), relation("uses"), entity(Z)), Facts).

apply_inference_rules(Facts, Inferred) :-
    list.foldl((pred(F::in, Acc0::in, Acc::out) is det :-
        ( if infer(F, NewF) then
            Acc = [NewF | Acc0]
        else
            Acc = Acc0
        )
    ), Facts, [], Inferred).