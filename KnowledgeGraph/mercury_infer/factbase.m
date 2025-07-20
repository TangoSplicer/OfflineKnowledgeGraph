:- module factbase.
:- interface.

:- import_module list, string, types.

:- pred load_facts(string::in, list(fact)::out) is det.
:- pred store_facts(string::in, list(fact)::in) is det.

:- implementation.

load_facts(File, Facts) :-
    % Placeholder: simulate with static facts
    Facts = [known("entity(a)"), known("entity(b)"), known("relation(a,b)")].

store_facts(_File, _Facts) :-
    true.