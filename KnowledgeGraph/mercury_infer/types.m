:- module types.
:- interface.

:- type id == string.
:- type label == string.

:- type entity_type
    --->    person
    ;       location
    ;       concept
    ;       event
    ;       unknown.

:- type entity
    --->    entity(
                id          :: id,
                label       :: label,
                etype       :: entity_type,
                attributes  :: list(pair(string, string))
            ).

:- type edge
    --->    edge(
                from        :: id,
                to          :: id,
                relation    :: string
            ).

:- type graph
    --->    graph(
                nodes       :: list(entity),
                edges       :: list(edge)
            ).

:- type fact
    --->    known(string)
    ;       inferred(string)
    ;       contradiction(string).

:- type inference_result
    --->    valid(list(fact))
    ;       invalid(list(fact)).

:- type rule_id == string.

:- type rule
    --->    rule(
                id          :: rule_id,
                priority    :: float,
                apply       :: graph -> list(fact)
            ).