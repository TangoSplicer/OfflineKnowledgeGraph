:- module plugin.
:- interface.
:- import_module list.
:- import_module facts.

:- pred infer_and_check(list(fact)::in, list(fact)::out, list(fact)::out) is det.

%----------------------------------------
:- implementation.

:- import_module engine.
:- import_module validator.

infer_and_check(InputFacts, OutFacts, Conflicts) :-
    engine.run(InputFacts, OutFacts),
    validator.check_conflicts(OutFacts, Conflicts).