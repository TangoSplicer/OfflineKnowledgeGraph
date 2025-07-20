:- module ruleset.
:- interface.

:- import_module types.

:- pred get_rules(list(rule)::out) is det.

:- implementation.

get_rules([
    rule("r1", 0.9, infer_relatedness),
    rule("r2", 0.7, infer_concept_links)
]).

:- func infer_relatedness(graph) = list(fact).
infer_relatedness(Graph) = Facts :-
    % Basic pattern match on node connections
    ( if Graph^edges = [edge(F, T, R) | _], R = "linked" then
        Facts = [inferred("inferred_link(" ++ F ++ "," ++ T ++ ")")]
    else
        Facts = []
    ).

:- func infer_concept_links(graph) = list(fact).
infer_concept_links(Graph) = Facts :-
    ( if Graph^nodes = [entity(Id, Label, concept, _) | _],
           string.prefix(Label, "Knowledge") then
        Facts = [inferred("concept_root(" ++ Id ++ ")")]
    else
        Facts = []
    ).