:- module validator.
:- interface.
:- import_module list.
:- import_module facts.

:- pred check_conflicts(list(fact)::in, list(fact)::out) is det.

%----------------------------------------
:- implementation.

check_conflicts(Facts, Conflicts) :-
    list.foldl((pred(F::in, Acc0::in, Acc::out) is det :-
        ( if
            list.member(
                fact(subject(F^subject), predicate(F^predicate), object(entity("!contradict"))),
                Facts)
        then
            Acc = [F | Acc0]
        else
            Acc = Acc0
        )
    ), Facts, [], Conflicts).