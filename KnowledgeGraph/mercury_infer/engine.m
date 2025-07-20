:- module engine.
:- interface.
:- import_module list.
:- import_module facts.

:- pred run(list(fact)::in, list(fact)::out) is det.

%----------------------------------------
:- implementation.

:- import_module rules.

run(InputFacts, ResultFacts) :-
    apply_inference_rules(InputFacts, Inferred),
    ResultFacts = list.remove_dupes(InputFacts ++ Inferred).