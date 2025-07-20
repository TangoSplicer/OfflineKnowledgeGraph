:- module facts.
:- interface.
:- import_module list.

:- type entity ---> entity(string).
:- type relation ---> relation(string).
:- type fact
    ---> fact(subject :: entity, predicate :: relation, object :: entity).

:- func show_fact(fact) = string.
:- pred valid_fact(fact).
:- mode valid_fact(in) is semidet.

:- pred example_facts(list(fact)).
:- mode example_facts(out) is det.

%----------------------------------------
:- implementation.

show_fact(fact(entity(S), relation(P), entity(O))) =
    string.format("%s --[%s]--> %s", [S, P, O]).

valid_fact(fact(_, relation(P), _)) :-
    P \= "".

example_facts([
    fact(entity("alice"), relation("works-on"), entity("project-alpha")),
    fact(entity("project-alpha"), relation("uses"), entity("technology-y"))
]).