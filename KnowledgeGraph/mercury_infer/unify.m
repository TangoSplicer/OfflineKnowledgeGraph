:- module unify.
:- interface.

:- import_module types.

:- pred unify_fact(fact::in, fact::in, bool::out) is det.

:- implementation.

unify_fact(known(A), known(B), Yes) :-
    Yes = (A = B).
unify_fact(inferred(A), inferred(B), Yes) :-
    Yes = (A = B).
unify_fact(_, _, no).