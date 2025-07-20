:- module proof.contradiction_explainer.
:- interface.
:- import_module string.

:- func explain_contradiction(string, string) = string.

:- implementation.

explain_contradiction(FactA, FactB) = Explanation :-
    string.format("Contradiction detected: %s vs %s.\nPlease verify input assumptions or override rules.", [s(FactA), s(FactB)]) = Explanation.